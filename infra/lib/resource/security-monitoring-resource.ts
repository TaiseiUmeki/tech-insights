import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudTrailConstruct } from '../construct/security/cloudtrail-construct';
import { CloudTrailBucketConstruct } from '../construct/datastore/cloudtrail-bucket-construct';
import { CloudWatchAlarmConstruct } from '../construct/security/cloudwatch-alarm-construct';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as path from 'path';

export interface SecurityMonitoringResourceProps {
  /**
   * リソース名プレフィックス（例: 'dev-cdk-template'）
   */
  namePrefix: string;
  /**
   * Slack Incoming Webhook URLを格納したSSM Parameter Storeのパラメータ名
   * 指定するとLambda経由でSlackに通知される
   */
  slackWebhookUrlParameterName?: string;
  /**
   * CloudWatch Logsの保持期間（日）
   * @default 90
   */
  logRetentionDays?: number;
  /**
   * S3ログのGlacierへの移行日数
   * @default 90
   */
  glacierTransitionDays?: number;
  /**
   * S3ログのDeep Archiveへの移行日数
   * @default 365
   */
  deepArchiveTransitionDays?: number;
  /**
   * S3 Object Lockを有効化するか（Complianceモード）
   * 有効化するとログの改ざん防止が強化されるが、バケット削除に制約が生じる
   * @default false
   */
  enableObjectLock?: boolean;
  /**
   * S3 Object Lockの保持日数
   * enableObjectLock が true の場合のみ有効
   * @default 90
   */
  objectLockRetentionDays?: number;
  /**
   * CloudWatch Dashboardを有効化するか
   * @default false
   */
  enableDashboard?: boolean;
  /**
   * 削除ポリシー
   * @default RETAIN
   */
  removalPolicy?: RemovalPolicy;
}

/**
 * レイヤー2: セキュリティ監視Resource（機能単位）
 *
 * 責務: CloudTrailによるセキュリティ監視基盤の提供
 * - Phase 1: CloudWatch LogGroup → CloudTrailBucket → CloudTrail Trail
 * - Phase 2: SNS Alert Topic（+ Email Subscription）
 * - Phase 3: EventBridge Rules（ログ改ざん検知 + インフラ変更検知）
 * - Phase 4: CloudWatch MetricFilter + Alarm（4セット）
 * - Phase 5: CloudWatch Dashboard（オプション）
 *
 * 含まれるConstruct: CloudTrailConstruct, CloudTrailBucketConstruct, CloudWatchAlarmConstruct
 *
 * 変更頻度: まれ（監視ルール追加時）
 */
export class SecurityMonitoringResource extends Construct {
  public readonly trail: cloudtrail.Trail;
  public readonly logBucket: s3.IBucket;
  public readonly alertTopic: sns.Topic;
  public readonly logGroup: logs.LogGroup;
  public readonly dashboard?: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: SecurityMonitoringResourceProps) {
    super(scope, id);

    const metricNamespace = `${props.namePrefix}/SecurityMonitoring`;

    // ========================================
    // Phase 1: CloudWatch LogGroup → CloudTrailBucket → CloudTrail Trail
    // ========================================

    // CloudWatch LogGroup（CloudTrailログの配信先）
    this.logGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/${props.namePrefix}`,
      retention: this.getRetentionDays(props.logRetentionDays ?? 90),
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
    });

    // CloudTrailログ保存用S3バケット
    const bucketConstruct = new CloudTrailBucketConstruct(this, 'CloudTrailBucket', {
      bucketName: `${props.namePrefix}-cloudtrail-logs`,
      enableObjectLock: props.enableObjectLock ?? false,
      objectLockRetentionDays: props.objectLockRetentionDays ?? 90,
      glacierTransitionDays: props.glacierTransitionDays ?? 90,
      deepArchiveTransitionDays: props.deepArchiveTransitionDays ?? 365,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
    });
    this.logBucket = bucketConstruct.bucket;

    // CloudTrail Trail
    const trailConstruct = new CloudTrailConstruct(this, 'CloudTrail', {
      trailName: `${props.namePrefix}-trail`,
      logBucket: this.logBucket,
      cloudWatchLogGroup: this.logGroup,
    });
    this.trail = trailConstruct.trail;

    // ========================================
    // Phase 2: SNS Alert Topic
    // ========================================

    this.alertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      topicName: `${props.namePrefix}-security-alerts`,
      displayName: `Security Alerts (${props.namePrefix})`,
      masterKey: kms.Alias.fromAliasName(this, 'SnsEncryptionKey', 'alias/aws/sns'),
    });

    // Slack通知用Lambda Subscription（指定時のみ）
    if (props.slackWebhookUrlParameterName) {
      const slackNotifier = new NodejsFunction(this, 'SlackNotifier', {
        functionName: `${props.namePrefix}-slack-notifier`,
        entry: path.join(__dirname, '../../lambda/slack-notifier/index.ts'),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: Duration.seconds(10),
        environment: {
          SLACK_WEBHOOK_URL_PARAMETER_NAME: props.slackWebhookUrlParameterName,
        },
        bundling: {
          minify: true,
          // AWS SDKはLambdaランタイムに含まれるため外部化
          externalModules: ['@aws-sdk/*'],
        },
      });

      // SSM Parameter Store読み取り権限を付与（SecureString対応のためkms:Decryptも付与）
      slackNotifier.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter'],
          resources: [
            `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${props.slackWebhookUrlParameterName}`,
          ],
        })
      );
      // KMS Decrypt権限: ViaService条件 + EncryptionContext条件で対象パラメータに限定
      slackNotifier.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['kms:Decrypt'],
          resources: [
            `arn:aws:kms:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:key/*`,
          ],
          conditions: {
            StringEquals: {
              'kms:ViaService': `ssm.${cdk.Stack.of(this).region}.amazonaws.com`,
              'kms:EncryptionContext:PARAMETER_ARN': `arn:aws:ssm:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:parameter${props.slackWebhookUrlParameterName}`,
            },
          },
        })
      );

      this.alertTopic.addSubscription(
        new sns_subscriptions.LambdaSubscription(slackNotifier)
      );
    }

    // ========================================
    // Phase 3: EventBridge Rules
    // ========================================

    // ログ改ざん検知ルール
    // 注意: S3データイベント（DeleteObject等）はCloudTrailの管理イベントには含まれないため、
    // デフォルトではCloudTrail/S3の管理APIのみを監視する。
    // S3オブジェクトレベルの検知が必要な場合は、下記のS3データイベント有効化と
    // eventNameへのDeleteObject追加を有効化すること（追加コスト発生）。
    new events.Rule(this, 'LogTamperingRule', {
      ruleName: `${props.namePrefix}-log-tampering-detection`,
      description: 'CloudTrailログの改ざん・無効化を検知',
      eventPattern: {
        source: ['aws.cloudtrail', 'aws.s3'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['cloudtrail.amazonaws.com', 's3.amazonaws.com'],
          eventName: [
            // CloudTrail改ざん
            'StopLogging',
            'DeleteTrail',
            'UpdateTrail',
            // S3バケット改ざん（管理イベント）
            'DeleteBucket',
            'PutBucketPolicy',
            'PutBucketLifecycle',
            // S3データイベント有効化時のみ検知可能（下記コメント参照）
            // 'DeleteObject',
          ],
        },
      },
      targets: [new events_targets.SnsTopic(this.alertTopic)],
    });

    // S3データイベント有効化（オブジェクトレベルの操作を検知する場合にコメント解除）
    // 有効化するとCloudTrailのデータイベント記録が追加され、
    // EventBridgeルールのeventNameに 'DeleteObject' を追加することでオブジェクト削除を検知可能。
    // ※ データイベントはリクエスト量に応じた追加コストが発生する
    // trailConstruct.trail.addS3EventSelector([{
    //   bucket: this.logBucket,
    // }], {
    //   readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
    // });

    // ========================================
    // Phase 4: CloudWatch MetricFilter + Alarm
    // ========================================

    // 1. Rootアカウントログイン検知
    new CloudWatchAlarmConstruct(this, 'RootLoginAlarm', {
      alarmName: `${props.namePrefix}-root-account-login`,
      filterPattern: logs.FilterPattern.literal(
        '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      ),
      metricName: 'RootAccountLogin',
      metricNamespace,
      logGroup: this.logGroup,
      threshold: 1,
      evaluationPeriodSeconds: 300,
      alarmTopic: this.alertTopic,
    });

    // 2. MFA未使用ログイン検知
    new CloudWatchAlarmConstruct(this, 'NoMfaLoginAlarm', {
      alarmName: `${props.namePrefix}-no-mfa-login`,
      filterPattern: logs.FilterPattern.literal(
        '{ $.eventName = "ConsoleLogin" && $.additionalEventData.MFAUsed = "No" }'
      ),
      metricName: 'NoMfaConsoleLogin',
      metricNamespace,
      logGroup: this.logGroup,
      threshold: 1,
      evaluationPeriodSeconds: 300,
      alarmTopic: this.alertTopic,
    });

    // 3. アクセス拒否スパイク検知
    new CloudWatchAlarmConstruct(this, 'AccessDeniedAlarm', {
      alarmName: `${props.namePrefix}-access-denied-spike`,
      filterPattern: logs.FilterPattern.literal(
        '{ $.errorCode = "AccessDenied" || $.errorCode = "UnauthorizedAccess" }'
      ),
      metricName: 'AccessDeniedCount',
      metricNamespace,
      logGroup: this.logGroup,
      threshold: 10,
      evaluationPeriodSeconds: 300,
      alarmTopic: this.alertTopic,
    });

    // ========================================
    // Phase 5: CloudWatch Dashboard（オプション）
    // ========================================

    if (props.enableDashboard) {
      this.dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
        dashboardName: `${props.namePrefix}-security-monitoring`,
      });

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Root Account Login',
          left: [new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'RootAccountLogin',
            period: Duration.hours(1),
            statistic: 'Sum',
          })],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: 'MFA-less Console Login',
          left: [new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'NoMfaConsoleLogin',
            period: Duration.hours(1),
            statistic: 'Sum',
          })],
          width: 12,
        }),
      );

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'Access Denied Count',
          left: [new cloudwatch.Metric({
            namespace: metricNamespace,
            metricName: 'AccessDeniedCount',
            period: Duration.minutes(5),
            statistic: 'Sum',
          })],
          width: 24,
        }),
      );
    }
  }

  /**
   * 日数からRetentionDays enumに変換
   */
  private getRetentionDays(days: number): logs.RetentionDays {
    const mapping: Record<number, logs.RetentionDays> = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      120: logs.RetentionDays.FOUR_MONTHS,
      150: logs.RetentionDays.FIVE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
      400: logs.RetentionDays.THIRTEEN_MONTHS,
      545: logs.RetentionDays.EIGHTEEN_MONTHS,
      731: logs.RetentionDays.TWO_YEARS,
      1096: logs.RetentionDays.THREE_YEARS,
      1827: logs.RetentionDays.FIVE_YEARS,
      2192: logs.RetentionDays.SIX_YEARS,
      2557: logs.RetentionDays.SEVEN_YEARS,
      2922: logs.RetentionDays.EIGHT_YEARS,
      3288: logs.RetentionDays.NINE_YEARS,
      3653: logs.RetentionDays.TEN_YEARS,
    };
    const result = mapping[days];
    if (!result) {
      const validDays = Object.keys(mapping).join(', ');
      throw new Error(
        `logRetentionDays に ${days} が指定されましたが、CloudWatch Logsでサポートされていません。有効な値: ${validDays}`
      );
    }
    return result;
  }
}
