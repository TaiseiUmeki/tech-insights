import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface ClientVpnConstructProps {
  /**
   * VPNエンドポイント名
   */
  vpnName: string;
  /**
   * VPC
   */
  vpc: ec2.IVpc;
  /**
   * VPNサーバー用ACM証明書ARN
   */
  serverCertificateArn: string;
  /**
   * VPNクライアント用ACM証明書ARN（相互認証）
   */
  clientCertificateArn: string;
  /**
   * VPNクライアントに割り当てるCIDRブロック
   */
  clientCidrBlock: string;
  /**
   * VPNクライアントがアクセスを許可されるCIDRブロックのリスト
   * 未指定の場合、ALBが配置されたパブリックサブネットのCIDRのみ許可（最小権限）
   * VPC全体へのアクセスが必要な場合は [vpc.vpcCidrBlock] を指定
   */
  allowedCidrs?: string[];
  /**
   * スプリットトンネルを有効化
   * @default true
   */
  splitTunnel?: boolean;
  /**
   * DNSサーバー
   */
  dnsServers?: string[];
  /**
   * トランスポートプロトコル
   * @default 'udp'
   */
  transportProtocol?: 'udp' | 'tcp';
  /**
   * 削除ポリシー
   * @default RemovalPolicy.DESTROY
   */
  removalPolicy?: RemovalPolicy;
}

/**
 * レイヤー1: ClientVpnConstruct（単一リソース）
 *
 * 責務: AWS Client VPN Endpointの作成
 * - VPNエンドポイント（相互認証）
 * - VPN用セキュリティグループ
 * - ターゲットネットワーク関連付け（プライベートサブネット）
 * - サブネット単位の認可ルール（デフォルト: ALBが配置されたパブリックサブネットのみ）
 * - 接続ログ（CloudWatch Logs）
 *
 * 注意: CDKにClient VPNのL2コンストラクトが存在しないため、
 * CfnClientVpnEndpoint（L1）を使用しています。
 */
export class ClientVpnConstruct extends Construct {
  public readonly vpnEndpoint: ec2.CfnClientVpnEndpoint;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ClientVpnConstructProps) {
    super(scope, id);

    const splitTunnel = props.splitTunnel !== false;
    const transportProtocol = props.transportProtocol ?? 'udp';

    // VPN接続ログ用CloudWatch Logsグループ
    const logGroup = new logs.LogGroup(this, 'VpnLogGroup', {
      logGroupName: `/aws/client-vpn/${props.vpnName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
    });

    const logStream = new logs.LogStream(this, 'VpnLogStream', {
      logGroup,
      logStreamName: 'connection-log',
      removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
    });

    // VPN用セキュリティグループ
    this.securityGroup = new ec2.SecurityGroup(this, 'VpnSecurityGroup', {
      securityGroupName: `${props.vpnName}-sg`,
      vpc: props.vpc,
      description: 'Client VPN Endpoint用セキュリティグループ',
      allowAllOutbound: true,
    });

    // Client VPN Endpoint
    this.vpnEndpoint = new ec2.CfnClientVpnEndpoint(this, 'VpnEndpoint', {
      description: props.vpnName,
      serverCertificateArn: props.serverCertificateArn,
      clientCidrBlock: props.clientCidrBlock,
      connectionLogOptions: {
        enabled: true,
        cloudwatchLogGroup: logGroup.logGroupName,
        cloudwatchLogStream: logStream.logStreamName,
      },
      authenticationOptions: [
        {
          type: 'certificate-authentication',
          mutualAuthentication: {
            clientRootCertificateChainArn: props.clientCertificateArn,
          },
        },
      ],
      transportProtocol,
      splitTunnel,
      vpcId: props.vpc.vpcId,
      securityGroupIds: [this.securityGroup.securityGroupId],
      dnsServers: props.dnsServers,
    });

    // ターゲットネットワーク関連付け（プライベートサブネット）
    const privateSubnets = props.vpc.privateSubnets;
    privateSubnets.forEach((subnet, index) => {
      const association = new ec2.CfnClientVpnTargetNetworkAssociation(
        this,
        `TargetNetwork${index}`,
        {
          clientVpnEndpointId: this.vpnEndpoint.ref,
          subnetId: subnet.subnetId,
        }
      );
      // 関連付けはエンドポイント作成後に行う
      association.addDependency(this.vpnEndpoint);
    });

    // 認可ルール: 許可するCIDRを指定（デフォルトはALBが配置されたパブリックサブネットのみ）
    const allowedCidrs = props.allowedCidrs ??
      props.vpc.publicSubnets.map(subnet => subnet.ipv4CidrBlock);

    allowedCidrs.forEach((cidr, index) => {
      const authRule = new ec2.CfnClientVpnAuthorizationRule(
        this,
        `AuthRule${index}`,
        {
          clientVpnEndpointId: this.vpnEndpoint.ref,
          targetNetworkCidr: cidr,
          authorizeAllGroups: true,
          description: `サブネット ${cidr} へのアクセスを許可`,
        }
      );
      authRule.addDependency(this.vpnEndpoint);
    });
  }
}
