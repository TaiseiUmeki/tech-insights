import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Duration } from 'aws-cdk-lib';

export interface CloudWatchAlarmConstructProps {
  /**
   * アラーム名
   */
  alarmName: string;
  /**
   * MetricFilterのフィルタパターン
   */
  filterPattern: logs.IFilterPattern;
  /**
   * メトリクス名
   */
  metricName: string;
  /**
   * メトリクス名前空間
   */
  metricNamespace: string;
  /**
   * 対象のロググループ
   */
  logGroup: logs.ILogGroup;
  /**
   * アラーム閾値
   * @default 1
   */
  threshold?: number;
  /**
   * 評価期間（秒）
   * @default 300 (5分)
   */
  evaluationPeriodSeconds?: number;
  /**
   * アラーム通知先SNSトピック
   */
  alarmTopic?: sns.ITopic;
}

/**
 * レイヤー1: CloudWatch MetricFilter + Alarm Construct（単一リソース）
 *
 * 責務: CloudWatch Logsから特定パターンを検出し、アラームで通知する
 * - MetricFilter: ログからメトリクスを抽出
 * - Alarm: 閾値超過時にSNS通知
 *
 * 変更頻度: ほぼなし
 */
export class CloudWatchAlarmConstruct extends Construct {
  public readonly metricFilter: logs.MetricFilter;
  public readonly alarm: cloudwatch.Alarm;
  public readonly metric: cloudwatch.Metric;

  constructor(scope: Construct, id: string, props: CloudWatchAlarmConstructProps) {
    super(scope, id);

    const periodSeconds = props.evaluationPeriodSeconds ?? 300;

    // MetricFilter
    this.metricFilter = new logs.MetricFilter(this, 'MetricFilter', {
      logGroup: props.logGroup,
      filterPattern: props.filterPattern,
      metricNamespace: props.metricNamespace,
      metricName: props.metricName,
      metricValue: '1',
      defaultValue: 0,
    });

    // Metric
    this.metric = new cloudwatch.Metric({
      namespace: props.metricNamespace,
      metricName: props.metricName,
      period: Duration.seconds(periodSeconds),
      statistic: 'Sum',
    });

    // Alarm
    this.alarm = new cloudwatch.Alarm(this, 'Alarm', {
      alarmName: props.alarmName,
      metric: this.metric,
      threshold: props.threshold ?? 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // SNSアクション（指定時のみ）
    if (props.alarmTopic) {
      this.alarm.addAlarmAction(new cloudwatch_actions.SnsAction(props.alarmTopic));
    }
  }
}
