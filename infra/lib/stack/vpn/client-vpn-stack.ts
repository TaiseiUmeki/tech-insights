import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../../config/environment';
import { ClientVpnConstruct } from '../../construct/networking/client-vpn-construct';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ClientVpnStackProps extends cdk.StackProps {
  /**
   * VPC（FoundationStackから渡される）
   */
  vpc: ec2.IVpc;
  /**
   * ALBのセキュリティグループ（BackendStackから渡される）
   * VPNからALBへのアクセス許可ルールを追加するために使用
   */
  albSecurityGroup: ec2.ISecurityGroup;
}

/**
 * レイヤー3: Client VPN Stack（VPN接続スタック）
 *
 * 責務: VPN経由でのALBアクセス環境の提供
 * - AWS Client VPN Endpoint
 * - VPN → ALBへのセキュリティグループルール
 *
 * 変更頻度: 稀（証明書更新、認可ルール変更時）
 * デプロイ時間: 約3-5分
 *
 * 前提条件:
 * - ACMにサーバー/クライアント証明書をインポート済み
 * - 証明書ARNをconfig/environment.tsに設定済み
 */
export class ClientVpnStack extends cdk.Stack {
  public readonly vpnEndpoint: ec2.CfnClientVpnEndpoint;
  public readonly vpnSecurityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    props: ClientVpnStackProps
  ) {
    super(scope, id, props);

    if (!config.clientVpn?.enabled) {
      throw new Error('ClientVpnStack requires clientVpn config with enabled: true');
    }
    const vpnConfig = config.clientVpn;

    // Client VPN Endpointの作成
    const vpnConstruct = new ClientVpnConstruct(this, 'ClientVpn', {
      vpnName: `${config.envName}-cdk-template-vpn`,
      vpc: props.vpc,
      serverCertificateArn: vpnConfig.serverCertificateArn,
      clientCertificateArn: vpnConfig.clientCertificateArn,
      clientCidrBlock: vpnConfig.clientCidrBlock,
      splitTunnel: vpnConfig.splitTunnel,
      dnsServers: vpnConfig.dnsServers,
      transportProtocol: vpnConfig.transportProtocol,
      removalPolicy: config.removalPolicy,
    });

    this.vpnEndpoint = vpnConstruct.vpnEndpoint;
    this.vpnSecurityGroup = vpnConstruct.securityGroup;

    // ALBセキュリティグループにVPNからのアクセスを許可
    // CfnSecurityGroupIngressを使用してクロススタック循環参照を回避
    new ec2.CfnSecurityGroupIngress(this, 'VpnToAlbHttp', {
      ipProtocol: 'tcp',
      fromPort: 80,
      toPort: 80,
      groupId: props.albSecurityGroup.securityGroupId,
      sourceSecurityGroupId: vpnConstruct.securityGroup.securityGroupId,
      description: 'Client VPNからALBへのHTTPアクセスを許可',
    });

    new ec2.CfnSecurityGroupIngress(this, 'VpnToAlbHttps', {
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      groupId: props.albSecurityGroup.securityGroupId,
      sourceSecurityGroupId: vpnConstruct.securityGroup.securityGroupId,
      description: 'Client VPNからALBへのHTTPSアクセスを許可',
    });

    // タグ付け
    cdk.Tags.of(this).add('Environment', config.envName);
    cdk.Tags.of(this).add('Project', config.tags.Project);
    cdk.Tags.of(this).add('ManagedBy', config.tags.ManagedBy);
    cdk.Tags.of(this).add('Layer', 'VPN');

    // Outputs
    new cdk.CfnOutput(this, 'VpnEndpointId', {
      value: vpnConstruct.vpnEndpoint.ref,
      description: 'Client VPN Endpoint ID',
      exportName: `${config.envName}-VpnEndpointId`,
    });

    new cdk.CfnOutput(this, 'VpnSecurityGroupId', {
      value: vpnConstruct.securityGroup.securityGroupId,
      description: 'Client VPN Security Group ID',
      exportName: `${config.envName}-VpnSecurityGroupId`,
    });
  }
}
