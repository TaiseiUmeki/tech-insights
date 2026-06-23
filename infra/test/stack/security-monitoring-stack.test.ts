import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityMonitoringStack } from '../../lib/stack/security-monitoring/security-monitoring-stack';
import { testConfig } from '../test-config';
import { EnvironmentConfig } from '../../config/environment';

describe('SecurityMonitoringStack', () => {
  const stackProps = {
    env: { account: '123456789012', region: 'ap-northeast-1' },
  };

  // テスト用にsecurityMonitoring有効のconfigを作成
  const enabledConfig: EnvironmentConfig = {
    ...testConfig,
    securityMonitoring: {
      enabled: true,
      logRetentionDays: 90,
      glacierTransitionDays: 90,
      objectLockRetentionDays: 90,
    },
  };

  describe('Basic Resource Creation', () => {
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      template = Template.fromStack(stack);
    });

    it('should create a CloudTrail Trail', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    it('should create an S3 bucket for logs', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    it('should create an SNS topic for alerts', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    it('should create a CloudWatch Log Group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    it('should create EventBridge rules', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    it('should create CloudWatch MetricFilters', () => {
      template.resourceCountIs('AWS::Logs::MetricFilter', 3);
    });

    it('should create CloudWatch Alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('CfnOutputs', () => {
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      template = Template.fromStack(stack);
    });

    it('should output TrailArn', () => {
      const outputs = template.findOutputs('TrailArn');
      expect(Object.keys(outputs).length).toBe(1);
    });

    it('should output LogBucketArn', () => {
      const outputs = template.findOutputs('LogBucketArn');
      expect(Object.keys(outputs).length).toBe(1);
    });

    it('should output AlertTopicArn', () => {
      const outputs = template.findOutputs('AlertTopicArn');
      expect(Object.keys(outputs).length).toBe(1);
    });

    it('should output LogGroupName', () => {
      const outputs = template.findOutputs('LogGroupName');
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('Dashboard', () => {
    it('should not create dashboard by default', () => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
    });

    it('should create dashboard when enableDashboard is true', () => {
      const app = new cdk.App();
      const configWithDashboard: EnvironmentConfig = {
        ...testConfig,
        securityMonitoring: {
          enabled: true,
          enableDashboard: true,
        },
      };
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        configWithDashboard,
        stackProps
      );
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    it('should output DashboardUrl when dashboard is enabled', () => {
      const app = new cdk.App();
      const configWithDashboard: EnvironmentConfig = {
        ...testConfig,
        securityMonitoring: {
          enabled: true,
          enableDashboard: true,
        },
      };
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        configWithDashboard,
        stackProps
      );
      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('DashboardUrl');
      expect(Object.keys(outputs).length).toBe(1);
    });
  });

  describe('Slack Notification', () => {
    it('should not create Lambda without slackWebhookUrlParameterName', () => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 0);
    });

    it('should create Lambda with slackWebhookUrlParameterName', () => {
      const app = new cdk.App();
      const configWithSlack: EnvironmentConfig = {
        ...testConfig,
        securityMonitoring: {
          enabled: true,
          slackWebhookUrlParameterName: '/myapp/test/slack-webhook-url',
        },
      };
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        configWithSlack,
        stackProps
      );
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            SLACK_WEBHOOK_URL_PARAMETER_NAME: '/myapp/test/slack-webhook-url',
          }),
        },
      });
    });

    it('should grant SSM read permission to Lambda', () => {
      const app = new cdk.App();
      const configWithSlack: EnvironmentConfig = {
        ...testConfig,
        securityMonitoring: {
          enabled: true,
          slackWebhookUrlParameterName: '/myapp/test/slack-webhook-url',
        },
      };
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        configWithSlack,
        stackProps
      );
      const template = Template.fromStack(stack);
      // Lambda用IAMロールにSSM読み取り権限が付与されていることを確認
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'ssm:GetParameter',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    it('should create SNS Lambda subscription with slackWebhookUrlParameterName', () => {
      const app = new cdk.App();
      const configWithSlack: EnvironmentConfig = {
        ...testConfig,
        securityMonitoring: {
          enabled: true,
          slackWebhookUrlParameterName: '/myapp/test/slack-webhook-url',
        },
      };
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        configWithSlack,
        stackProps
      );
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
      });
    });

  });

  describe('Tags', () => {
    it('should apply environment tags', () => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      const template = Template.fromStack(stack);

      // CloudTrail Trailリソースにタグが適用されていることを確認
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'test' }),
          Match.objectLike({ Key: 'Project', Value: 'cdk-template' }),
        ]),
      });
    });
  });

  describe('Synth Success', () => {
    it('should synth without errors', () => {
      const app = new cdk.App();
      const stack = new SecurityMonitoringStack(
        app,
        'TestSecurityMonitoringStack',
        enabledConfig,
        stackProps
      );
      // synth()が例外を投げないことを確認
      expect(() => app.synth()).not.toThrow();
    });
  });
});
