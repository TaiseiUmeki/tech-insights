import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../../../config/environment';
import { SecurityMonitoringResource } from '../../resource/security-monitoring-resource';

export interface SecurityMonitoringStackProps extends cdk.StackProps {}

/**
 * レイヤー3: SecurityMonitoring Stack（セキュリティ監視スタック）
 *
 * 責務: CloudTrailによるセキュリティ監視基盤の提供
 * - CloudTrail Trail（全リージョン、ログファイルバリデーション有効）
 * - S3バケット（Object Lock、ライフサイクル、削除Deny）
 * - EventBridge Rules（ログ改ざん検知、インフラ変更検知）
 * - CloudWatch MetricFilter + Alarm（Root Login、MFA未使用、Access Denied、IAM変更）
 * - CloudWatch Dashboard（オプション）
 *
 * 他スタックへの依存なし（CloudTrailは独立リソース）
 *
 * 変更頻度: まれ（監視ルール追加時）
 * デプロイ時間: 約3-5分
 */
export class SecurityMonitoringStack extends cdk.Stack {
  public readonly resource: SecurityMonitoringResource;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    props?: SecurityMonitoringStackProps
  ) {
    super(scope, id, props);

    const systemName = 'cdk-template';

    // SecurityMonitoringResource
    this.resource = new SecurityMonitoringResource(this, 'SecurityMonitoringResource', {
      namePrefix: `${config.envName}-${systemName}`,
      slackWebhookUrlParameterName: config.securityMonitoring?.slackWebhookUrlParameterName,
      logRetentionDays: config.securityMonitoring?.logRetentionDays,
      glacierTransitionDays: config.securityMonitoring?.glacierTransitionDays,
      deepArchiveTransitionDays: config.securityMonitoring?.deepArchiveTransitionDays,
      enableObjectLock: config.securityMonitoring?.enableObjectLock,
      objectLockRetentionDays: config.securityMonitoring?.objectLockRetentionDays,
      enableDashboard: config.securityMonitoring?.enableDashboard,
      removalPolicy: config.removalPolicy,
    });

    // タグ付け
    cdk.Tags.of(this).add('Environment', config.envName);
    cdk.Tags.of(this).add('Project', config.tags.Project);
    cdk.Tags.of(this).add('ManagedBy', config.tags.ManagedBy);

    // Outputs
    new cdk.CfnOutput(this, 'TrailArn', {
      value: this.resource.trail.trailArn,
      description: 'CloudTrail Trail ARN',
      exportName: `${config.envName}-SecurityTrailArn`,
    });

    new cdk.CfnOutput(this, 'LogBucketArn', {
      value: this.resource.logBucket.bucketArn,
      description: 'CloudTrail Log Bucket ARN',
      exportName: `${config.envName}-SecurityLogBucketArn`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.resource.alertTopic.topicArn,
      description: 'Security Alert SNS Topic ARN',
      exportName: `${config.envName}-SecurityAlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.resource.logGroup.logGroupName,
      description: 'CloudTrail CloudWatch Log Group Name',
      exportName: `${config.envName}-SecurityLogGroupName`,
    });

    if (this.resource.dashboard) {
      new cdk.CfnOutput(this, 'DashboardUrl', {
        value: `https://console.aws.amazon.com/cloudwatch/home?region=${
          cdk.Stack.of(this).region
        }#dashboards:name=${this.resource.dashboard.dashboardName}`,
        description: 'Security Monitoring Dashboard URL',
      });
    }
  }
}
