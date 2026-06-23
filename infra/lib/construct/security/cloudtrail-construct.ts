import { Construct } from 'constructs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface CloudTrailConstructProps {
  /**
   * Trail名
   */
  trailName: string;
  /**
   * ログ保存先S3バケット
   */
  logBucket: s3.IBucket;
  /**
   * CloudWatch Logsの配信先ロググループ
   * 指定するとCloudWatch Logsへのログ配信が有効化される
   */
  cloudWatchLogGroup?: logs.ILogGroup;
  /**
   * S3バケット内のキープレフィックス
   * @default 'cloudtrail'
   */
  s3KeyPrefix?: string;
}

/**
 * レイヤー1: CloudTrail Construct（単一リソース）
 *
 * 責務: CloudTrail Trailの作成
 * - 全リージョン対応
 * - ログファイルバリデーション有効
 * - CloudWatch Logs配信（オプション）
 *
 * 変更頻度: ほぼなし
 */
export class CloudTrailConstruct extends Construct {
  public readonly trail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: CloudTrailConstructProps) {
    super(scope, id);

    this.trail = new cloudtrail.Trail(this, 'Trail', {
      trailName: props.trailName,
      bucket: props.logBucket,
      s3KeyPrefix: props.s3KeyPrefix ?? 'cloudtrail',
      // セキュアなデフォルト設定
      isMultiRegionTrail: true,
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
      // CloudWatch Logs配信（指定時のみ有効）
      sendToCloudWatchLogs: !!props.cloudWatchLogGroup,
      cloudWatchLogGroup: props.cloudWatchLogGroup,
    });
  }
}
