import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Template } from 'aws-cdk-lib/assertions';
import { Route53Stack } from '../../lib/stack/dns/route53-stack';
import { testConfig } from '../test-config';

describe('Route53Stack', () => {
  it('should create alias A records for ALB', () => {
    const app = new cdk.App();
    const infraStack = new cdk.Stack(app, 'InfraStack', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    const vpc = new ec2.Vpc(infraStack, 'Vpc', { maxAzs: 2 });
    const alb = new elbv2.ApplicationLoadBalancer(infraStack, 'Alb', {
      vpc,
      internetFacing: true,
    });

    const dnsStack = new Route53Stack(app, 'Route53Stack', testConfig, {
      env: { account: '123456789012', region: 'ap-northeast-1' },
      hostedZoneId: 'Z1234567890ABC',
      zoneName: 'example.com',
      alb,
      albRecordNames: ['api', 'app'],
    });
    dnsStack.addDependency(infraStack);

    const template = Template.fromStack(dnsStack);
    template.resourceCountIs('AWS::Route53::RecordSet', 2);
  });

  it('should synthesize', () => {
    const app = new cdk.App();
    const infraStack = new cdk.Stack(app, 'InfraStack2', {
      env: { account: '123456789012', region: 'ap-northeast-1' },
    });
    const vpc = new ec2.Vpc(infraStack, 'Vpc', { maxAzs: 2 });
    const alb = new elbv2.ApplicationLoadBalancer(infraStack, 'Alb', {
      vpc,
      internetFacing: true,
    });

    new Route53Stack(app, 'Route53Stack2', testConfig, {
      env: { account: '123456789012', region: 'ap-northeast-1' },
      hostedZoneId: 'Z1234567890ABC',
      zoneName: 'example.com',
      alb,
      albRecordNames: ['api'],
    });

    expect(() => app.synth()).not.toThrow();
  });
});
