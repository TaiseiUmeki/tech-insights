import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';

/**
 * WAF設定インターフェース
 */
export interface WafConfig {
  /**
   * WAFを有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * レートリミット（5分間あたりのリクエスト数）
   * @default 2000
   */
  rateLimit?: number;
  /**
   * Bot Control（AWS Managed Rules）を有効化するか
   * 注意: 追加コストが発生します
   * @default false
   */
  enableBotControl?: boolean;
}

/**
 * ロギング設定インターフェース
 */
export interface LoggingConfig {
  /**
   * ALBアクセスログを有効化
   * @default false
   */
  enableAlbLogs?: boolean;
  /**
   * VPC Flow Logsを有効化
   * @default false
   */
  enableVpcFlowLogs?: boolean;
  /**
   * ログの保持期間（日）
   * @default 90
   */
  retentionDays?: number;
  /**
   * Glacierへの移行日数（0で無効）
   * @default 30
   */
  glacierTransitionDays?: number;
}

/**
 * Bastion（踏み台サーバー）設定インターフェース
 */
export interface BastionConfig {
  /**
   * Bastionを有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * SSH接続を許可するCIDR（セキュリティのため制限推奨）
   * 例: '203.0.113.0/24'（オフィスIP等）
   * 指定しない場合はSSM Session Manager経由のみ
   * @default undefined
   */
  allowSshFrom?: string;
  /**
   * SSM Session Managerを有効化
   * @default true
   */
  enableSsm?: boolean;
}

/**
 * Batch（バッチ処理）設定インターフェース
 */
export interface BatchConfig {
  /**
   * Batchを有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * タスクのCPU（vCPU単位 × 1024）
   * 256 (.25 vCPU), 512 (.5 vCPU), 1024 (1 vCPU), 2048 (2 vCPU), 4096 (4 vCPU)
   * @default 256
   */
  cpu?: number;
  /**
   * タスクのメモリ（MB）
   * @default 512
   */
  memory?: number;
  /**
   * 既存のECSクラスターを使用するか（BackendStackのクラスター）
   * falseの場合、Batch専用クラスターを作成
   * @default true
   */
  useExistingCluster?: boolean;
}

/**
 * セキュリティ監視設定インターフェース
 */
export interface SecurityMonitoringConfig {
  /**
   * セキュリティ監視を有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * Slack Incoming Webhook URLを格納したSSM Parameter Store パラメータ名
   * 指定するとLambda経由でSlackに通知される
   * 事前に `aws ssm put-parameter --name "/myapp/slack-webhook-url" --value "https://hooks.slack.com/..." --type SecureString` で登録
   * 例: '/myapp/slack-webhook-url'
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
   * テンプレート試用後の後片付けを考慮しデフォルト無効
   * @default false
   */
  enableObjectLock?: boolean;
  /**
   * S3 Object Lockの保持日数（Complianceモード）
   * enableObjectLock が true の場合のみ有効
   * @default 90
   */
  objectLockRetentionDays?: number;
  /**
   * CloudWatch Dashboardを有効化するか
   * @default false
   */
  enableDashboard?: boolean;
}

/**
 * SES（メール送信）設定インターフェース
 */
export interface SesConfig {
  /**
   * SESを有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * 送信元のメールアドレスまたはドメイン
   * SES有効時は必須
   * 例: 'noreply@example.com' または 'example.com'
   */
  identity?: string;
  /**
   * Identityのタイプ（emailまたはdomain）
   * - email: メールアドレス単位で検証（検証メールが送信される）
   * - domain: ドメイン単位で検証（DNSレコード設定が必要）
   * @default 'email'
   */
  identityType?: 'email' | 'domain';
  /**
   * メールテンプレート定義
   * SESテンプレート変数（{{variable}}）を使用可能
   * @default []
   */
  templates?: Array<{
    /** テンプレート名（環境プレフィックスは自動付与） */
    templateName: string;
    /** メール件名テンプレート */
    subjectPart: string;
    /** HTMLメール本文テンプレート */
    htmlPart?: string;
    /** テキストメール本文テンプレート */
    textPart?: string;
  }>;
}

/**
 * Cognito設定インターフェース
 */
export interface CognitoConfig {
  /**
   * SMS認証を有効化
   * 有効にすると電話番号でのサインイン・MFA・アカウント回復が可能になる
   * 注意: SMS送信にはSNS経由での課金が発生します
   * @default false
   */
  enableSmsAuth?: boolean;
  /**
   * SMS送信者ID（11文字以内の英数字）
   * SMSメッセージの送信元として表示される
   * @default 'MyApp'
   */
  smsExternalId?: string;
}

/**
 * Client VPN設定インターフェース
 */
export interface ClientVpnConfig {
  /**
   * Client VPNを有効化するか
   * @default false
   */
  enabled: boolean;
  /**
   * VPNサーバー用のACM証明書ARN
   * 事前にACMにインポートが必要
   */
  serverCertificateArn: string;
  /**
   * VPNクライアント用のACM証明書ARN（相互認証）
   * 事前にACMにインポートが必要
   */
  clientCertificateArn: string;
  /**
   * VPNクライアントに割り当てるCIDRブロック
   * VPC CIDRと重複不可、/12〜/22の範囲
   * @default '10.100.0.0/16'
   */
  clientCidrBlock: string;
  /**
   * スプリットトンネルを有効化
   * true: VPC宛のみVPN経由、それ以外は直接インターネット
   * false: 全トラフィックがVPN経由
   * @default true
   */
  splitTunnel?: boolean;
  /**
   * VPNクライアント用DNSサーバー
   * @default undefined（VPCのDNSを使用）
   */
  dnsServers?: string[];
  /**
   * トランスポートプロトコル
   * @default 'udp'
   */
  transportProtocol?: 'udp' | 'tcp';
}

/**
 * Route 53 DNS（既存ホストゾーンにレコードを追加）
 */
export interface Route53DnsConfig {
  /**
   * Route53 レコードを CDK で管理するか
   */
  enabled: boolean;
  /**
   * 既存のパブリックホストゾーン ID（例: Z1234567890ABC）
   */
  hostedZoneId: string;
  /**
   * ゾーン名（例: example.com）
   */
  zoneName: string;
  /**
   * ALB へのエイリアス A レコードのサブドメイン名
   * 例: ['api'] → api.example.com。複数で同一 ALB へ（ECS フロント時は ['app','api'] など）
   * @default ['api']
   */
  albRecordNames?: string[];
  /**
   * CloudFront（frontend.type が s3-cloudfront のとき）向けサブドメイン名（例: app）
   * 未指定なら CloudFront 用レコードは作らない
   */
  cloudFrontRecordName?: string;
}

/**
 * 環境設定インターフェース
 */
export interface EnvironmentConfig {
  /**
   * 環境名 (dev, staging, prod)
   */
  envName: string;

  /**
   * AWSアカウントID
   */
  account: string;

  /**
   * AWSリージョン
   */
  region: string;

  /**
   * 削除ポリシー
   */
  removalPolicy: RemovalPolicy;

  /**
   * VPC・ネットワーク設定
   */
  network: {
    cidr: string;
    maxAzs: number;
    natGateways: number;
  };

  /**
   * データベース設定
   */
  database: {
    /**
     * DynamoDBを有効化するか
     * @default false
     */
    enableDynamo?: boolean;
    /**
     * Auroraを有効化するか（enableRdsとは排他）
     * @default false
     */
    enableAurora?: boolean;
    /**
     * RDSを有効化するか（enableAuroraとは排他）
     * @default true
     */
    enableRds?: boolean;
    /**
     * エンジンタイプ（RDS/Aurora共通）
     */
    engine: 'postgres' | 'mysql';
    /**
     * インスタンスタイプ
     */
    instanceType: ec2.InstanceType;
    /**
     * マルチAZ配置（RDSのみ有効）
     * @default true
     */
    multiAz: boolean;
    /**
     * ストレージサイズ（GB、RDSのみ有効）
     * @default 100
     */
    allocatedStorageGb: number;
    /**
     * Readerインスタンス数（Auroraのみ有効）
     */
    readerCount: number;
    /**
     * バックアップ保持期間（日）
     */
    backupRetentionDays: number;
    /**
     * 自動マイナーバージョンアップ
     * @default true（開発環境）, false（本番環境）
     */
    autoMinorVersionUpgrade: boolean;
  };

  /**
   * ECS設定
   */
  ecs: {
    backend: {
      cpu: number;
      memory: number;
      desiredCount: number;
      minCount: number;
      maxCount: number;
    };
    frontend: {
      cpu: number;
      memory: number;
      desiredCount: number;
      minCount: number;
      maxCount: number;
    };
  };

  /**
   * フロントエンド設定
   */
  frontend: {
    /**
     * フロントエンドデプロイ方式
     * - 'amplify': AWS Amplify Hosting（デフォルト、簡単）
     * - 's3-cloudfront': S3 + CloudFront（カスタマイズ性高）
     * - 'ecs': ECS Fargate（BackendStack と同一 ALB・クラスタで配信。VPN 経由の閉域利用など向け）
     */
    type: 'amplify' | 's3-cloudfront' | 'ecs';
    /**
     * GitHubリポジトリオーナー（Amplify使用時）
     */
    repositoryOwner?: string;
    /**
     * GitHubリポジトリ名（Amplify使用時）
     */
    repositoryName?: string;
    /**
     * メインブランチ名（Amplify使用時）
     * @default 'main'
     */
    mainBranch?: string;
    /**
     * フロントエンドディレクトリ（モノレポ用、Amplify使用時）
     * 例: 'frontend', 'apps/web'
     * @default undefined（リポジトリルート）
     */
    frontendDirectory?: string;
    /**
     * GitHubトークンのSecrets Manager名（Amplify使用時）
     * @default 'github-token'
     */
    githubTokenSecretName?: string;
    /**
     * プルリクエストプレビューを有効化（Amplify使用時）
     * @default false
     */
    enablePullRequestPreview?: boolean;
    /**
     * ECS フロント使用時: コンテナの待受ポート（nginx 等）
     * @default 80
     */
    ecsContainerPort?: number;
    /**
     * ECS フロント使用時: これらのパスパターンをバックエンド ECS へ転送（ALB リスナールール）
     * 例: ['/api/*', '/health', '/docs', '/openapi.json']
     * @default ['/api/*', '/health']
     */
    ecsBackendPathPatterns?: string[];
  };

  /**
   * Lambda設定
   * undefinedの場合、Lambdaは作成されません
   */
  lambda?: {
    memorySize: number;
    timeout: number;
    reservedConcurrency: number;
  };

  /**
   * WAF設定（本番環境推奨）
   * ALBとCloudFrontにWAFを適用
   */
  waf?: WafConfig;

  /**
   * Cognito設定
   * SMS認証などの追加機能を設定
   */
  cognito?: CognitoConfig;

  /**
   * ロギング設定
   * ALBアクセスログ、VPC Flow Logsなどの設定
   */
  logging?: LoggingConfig;

  /**
   * Bastion（踏み台サーバー）設定
   * RDS/Auroraへのアクセス用
   */
  bastion?: BastionConfig;

  /**
   * Batch（バッチ処理）設定
   * ECS Scheduled Taskによる定期実行
   */
  batch?: BatchConfig;

  /**
   * SES（メール送信）設定
   * メール送信機能が必要な場合に設定
   * 注意: 新しいAWSアカウントではSESサンドボックスモード。本番利用にはサンドボックス解除申請が必要
   */
  ses?: SesConfig;

  /**
   * セキュリティ監視設定
   * CloudTrailによるログ改ざん検知・不正操作のリアルタイムアラート
   */
  securityMonitoring?: SecurityMonitoringConfig;

  /**
   * Client VPN設定
   * VPN経由でALBにアクセスする場合に設定
   * 事前にACMにサーバー/クライアント証明書のインポートが必要
   */
  clientVpn?: ClientVpnConfig;

  /**
   * Route 53（既存ホストゾーンへのエイリアスレコード）
   * ゾーン本体の作成は含まない（コンソールまたは別途作成したパブリックホストゾーンを参照）
   */
  route53?: Route53DnsConfig;

  /**
   * タグ設定
   */
  tags: {
    [key: string]: string;
  };
}

