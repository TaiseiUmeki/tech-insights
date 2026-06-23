import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy, CfnResource } from 'aws-cdk-lib';

export interface CloudTrailBucketConstructProps {
  /**
   * バケット名
   */
  bucketName: string;
  /**
   * Object Lockを有効化するか（Complianceモード）
   * 注意: Object Lock有効化後はバケットの削除に制約あり
   * @default false
   */
  enableObjectLock?: boolean;
  /**
   * Object Lockのデフォルト保持日数（Complianceモード）
   * @default 90
   */
  objectLockRetentionDays?: number;
  /**
   * Glacierへの移行日数（0で無効）
   * @default 90
   */
  glacierTransitionDays?: number;
  /**
   * Deep Archiveへの移行日数（0で無効）
   * @default 365
   */
  deepArchiveTransitionDays?: number;
  /**
   * 削除ポリシー
   * @default RETAIN
   */
  removalPolicy?: RemovalPolicy;
}

/**
 * レイヤー1: CloudTrailログ保存用S3バケットConstruct（単一リソース）
 *
 * 責務: CloudTrailログの改ざん防止・長期保存用S3バケット
 * - Object Lock（Complianceモード）で改ざん防止
 * - バージョニング有効
 * - ライフサイクルルールでコスト最適化（Glacier/Deep Archive）
 * - 削除Denyポリシーで誤削除防止
 * - パブリックアクセス完全ブロック
 *
 * 変更頻度: ほぼなし
 */
export class CloudTrailBucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CloudTrailBucketConstructProps) {
    super(scope, id);

    const enableObjectLock = props.enableObjectLock ?? false;
    const glacierTransitionDays = props.glacierTransitionDays ?? 90;
    const deepArchiveTransitionDays = props.deepArchiveTransitionDays ?? 365;

    // ライフサイクルルールの構築
    const lifecycleRules: s3.LifecycleRule[] = [];
    const transitions: s3.Transition[] = [];

    if (glacierTransitionDays > 0) {
      transitions.push({
        storageClass: s3.StorageClass.GLACIER,
        transitionAfter: Duration.days(glacierTransitionDays),
      });
    }
    if (deepArchiveTransitionDays > 0) {
      transitions.push({
        storageClass: s3.StorageClass.DEEP_ARCHIVE,
        transitionAfter: Duration.days(deepArchiveTransitionDays),
      });
    }
    if (transitions.length > 0) {
      lifecycleRules.push({
        id: 'archive-old-logs',
        enabled: true,
        transitions,
      });
    }

    // S3バケット作成
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      // セキュアなデフォルト設定（AWS管理KMSキーで暗号化、自動ローテーション対応）
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
      // Object Lock有効時はautoDeleteObjectsは使用不可
      objectLockEnabled: enableObjectLock,
      lifecycleRules,
    });

    // Object Lock Default Retention（L2未対応のためescape hatch使用）
    if (enableObjectLock) {
      const cfnBucket = this.bucket.node.defaultChild as CfnResource;
      cfnBucket.addPropertyOverride('ObjectLockConfiguration', {
        ObjectLockEnabled: 'Enabled',
        Rule: {
          DefaultRetention: {
            Mode: 'COMPLIANCE',
            Days: props.objectLockRetentionDays ?? 90,
          },
        },
      });
    }

    // CDK/CloudFormation実行ロールを除外するCondition
    // スタック削除時にCloudFormationがバケット操作できるようにする（自アカウントに限定）
    const denyCondition = {
      StringNotLike: {
        'aws:PrincipalArn': `arn:aws:iam::${cdk.Stack.of(this).account}:role/cdk-*`,
      },
    };

    // 削除Denyポリシー: CloudTrailログオブジェクトの削除を禁止（CDKロール除外）
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyDeleteObject',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:DeleteObject', 's3:DeleteObjectVersion'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: denyCondition,
      })
    );

    // バケット削除Denyポリシー（CDKロール除外）
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyDeleteBucket',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:DeleteBucket'],
        resources: [this.bucket.bucketArn],
        conditions: denyCondition,
      })
    );
  }
}
