import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { ClientVpnStack } from '../../lib/stack/vpn/client-vpn-stack';
import { testConfig } from '../test-config';
import { EnvironmentConfig } from '../../config/environment';

const vpnEnabledConfig: EnvironmentConfig = {
  ...testConfig,
  clientVpn: {
    enabled: true,
    serverCertificateArn:
      'arn:aws:acm:ap-northeast-1:123456789012:certificate/server-cert',
    clientCertificateArn:
      'arn:aws:acm:ap-northeast-1:123456789012:certificate/client-cert',
    clientCidrBlock: '10.100.0.0/16',
    splitTunnel: true,
  },
};

function createPrerequisites(app: cdk.App) {
  const infraStack = new cdk.Stack(app, 'InfraStack', {
    env: { account: '123456789012', region: 'ap-northeast-1' },
  });
  const vpc = new ec2.Vpc(infraStack, 'Vpc', { maxAzs: 2 });
  const albSg = new ec2.SecurityGroup(infraStack, 'AlbSg', {
    vpc,
    description: 'ALB Security Group',
  });
  return { infraStack, vpc, albSg };
}

describe('ClientVpnStack', () => {
  it('VPNエンドポイントが作成される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    template.resourceCountIs('AWS::EC2::ClientVpnEndpoint', 1);
    template.hasResourceProperties('AWS::EC2::ClientVpnEndpoint', {
      ServerCertificateArn:
        'arn:aws:acm:ap-northeast-1:123456789012:certificate/server-cert',
      ClientCidrBlock: '10.100.0.0/16',
      SplitTunnel: true,
      TransportProtocol: 'udp',
    });
  });

  it('VPN用セキュリティグループが作成される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    // VPN用SG（Construct内で作成）
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
  });

  it('ALBセキュリティグループにHTTP/HTTPSのIngressルールが追加される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    // HTTP (80) と HTTPS (443) の2つのIngressルール
    template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 2);
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 80,
      ToPort: 80,
    });
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 443,
      ToPort: 443,
    });
  });

  it('ターゲットネットワーク関連付けがプライベートサブネット数分作成される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    template.resourceCountIs(
      'AWS::EC2::ClientVpnTargetNetworkAssociation',
      2 // maxAzs: 2 → プライベートサブネット2つ
    );
  });

  it('パブリックサブネット単位の認可ルールが作成される（最小権限）', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    // maxAzs: 2 → パブリックサブネット2つ分の認可ルール
    template.resourceCountIs('AWS::EC2::ClientVpnAuthorizationRule', 2);
    template.hasResourceProperties('AWS::EC2::ClientVpnAuthorizationRule', {
      AuthorizeAllGroups: true,
    });
  });

  it('接続ログ用のCloudWatch Logsが作成される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.resourceCountIs('AWS::Logs::LogStream', 1);
  });

  it('CfnOutputにVPNエンドポイントIDとSG IDが出力される', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    const template = Template.fromStack(vpnStack);
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('VpnEndpointId');
    expect(outputs).toHaveProperty('VpnSecurityGroupId');
  });

  it('synthが成功する', () => {
    const app = new cdk.App();
    const { infraStack, vpc, albSg } = createPrerequisites(app);

    const vpnStack = new ClientVpnStack(
      app,
      'TestVpnStack',
      vpnEnabledConfig,
      {
        env: { account: '123456789012', region: 'ap-northeast-1' },
        vpc,
        albSecurityGroup: albSg,
      }
    );
    vpnStack.addDependency(infraStack);

    expect(() => app.synth()).not.toThrow();
  });
});
