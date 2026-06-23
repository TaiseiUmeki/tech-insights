# Infrastructure

AWS CDK (TypeScript) を使用したインフラストラクチャ定義です。

**4 層レイヤードアーキテクチャ**を採用し、再利用性と保守性に優れた設計になっています。

---

## 前提条件

- **Node.js 18+**
- **AWS CLI** 設定済み
- **AWS CDK CLI** インストール済み

```bash
npm install -g aws-cdk
```

---

## セットアップ

```bash
# 1. 依存関係のインストール
npm install

# 2. ビルド
npm run build

# 3. CDKブートストラップ（初回のみ）
cdk bootstrap
```

---

## デプロイ

### 開発環境（dev）

```bash
# 全スタックを確認
cdk list --context env=dev

# CloudFormationテンプレートを生成
cdk synth --context env=dev

# 全スタックをデプロイ
cdk deploy --all --context env=dev

# 特定のスタックのみデプロイ
cdk deploy dev-BackendStack --context env=dev
```

### 本番環境（prod）

```bash
cdk deploy --all --context env=prod
```

---

## 開発コマンド

```bash
# スタック一覧を表示
cdk list --context env=dev

# デプロイ前の差分確認
cdk diff dev-BackendStack --context env=dev

# 特定スタックを削除
cdk destroy dev-BackendStack --context env=dev

# ビルド
npm run build

# ウォッチモード（コード変更を監視）
npm run watch

# テスト
npm test
```

---

## 4 層レイヤードアーキテクチャ

```
Layer 4: bin/app.ts               ← スタックの組み立て（全レイヤーに依存可）
    ↓
Layer 3: lib/stack/               ← デプロイ単位（CloudFormation Stack）
    ↓
Layer 2: lib/resource/            ← 機能単位（複数 Construct の組み合わせ）
    ↓
Layer 1: lib/construct/           ← 単一 AWS リソースの抽象化
    ↓
Layer 0: aws-cdk-lib              ← AWS CDK 公式ライブラリ
```

### 依存ルール

- L1 → L0 のみ依存可
- L2 → L1, L0 のみ依存可
- L3 → L2, L1, L0 のみ依存可
- L4 → 全レイヤーに依存可

---

## プロジェクト構造

```
infra/
├── bin/
│   ├── app.ts                              # L4: メインエントリポイント
│   └── poc-app.ts                          # L4: PoC エントリポイント
│
├── lib/
│   ├── construct/                          # L1: 単一 AWS リソース
│   │   ├── api/
│   │   │   ├── api-gateway-construct.ts
│   │   │   └── cloudfront-construct.ts
│   │   ├── compute/
│   │   │   ├── bastion-construct.ts
│   │   │   ├── ecr-construct.ts
│   │   │   ├── ecs-construct.ts
│   │   │   ├── lambda-construct.ts
│   │   │   └── scheduled-task-construct.ts
│   │   ├── datastore/
│   │   │   ├── aurora-construct.ts
│   │   │   ├── cloudtrail-bucket-construct.ts
│   │   │   ├── dynamodb-construct.ts
│   │   │   ├── rds-construct.ts
│   │   │   └── s3-construct.ts
│   │   ├── hosting/
│   │   │   └── amplify-construct.ts
│   │   ├── messaging/
│   │   │   ├── ses-identity-construct.ts
│   │   │   ├── ses-template-construct.ts
│   │   │   ├── sns-construct.ts
│   │   │   └── sqs-construct.ts
│   │   ├── networking/
│   │   │   ├── alb-construct.ts
│   │   │   ├── client-vpn-construct.ts
│   │   │   ├── isolation-nacl-construct.ts
│   │   │   ├── isolation-security-group-construct.ts
│   │   │   ├── security-group-construct.ts
│   │   │   └── vpc-construct.ts
│   │   └── security/
│   │       ├── cloudtrail-construct.ts
│   │       ├── cloudwatch-alarm-construct.ts
│   │       ├── cognito-construct.ts
│   │       ├── secrets-manager-construct.ts
│   │       └── waf-construct.ts
│   │
│   ├── resource/                           # L2: 機能単位
│   │   ├── api-resource.ts
│   │   ├── data-storage-resource.ts
│   │   ├── database-resource.ts
│   │   ├── email-resource.ts
│   │   ├── frontend-resource.ts
│   │   ├── messaging-resource.ts
│   │   ├── network-resource.ts
│   │   ├── object-storage-resource.ts
│   │   ├── security-monitoring-resource.ts
│   │   └── security-resource.ts
│   │
│   └── stack/                              # L3: デプロイ単位
│       ├── foundation/foundation-stack.ts
│       ├── data-storage/data-storage-stack.ts
│       ├── object-storage/object-storage-stack.ts
│       ├── security/security-stack.ts
│       ├── backend/backend-stack.ts
│       ├── frontend/frontend-stack.ts
│       ├── integration/integration-stack.ts
│       ├── batch/batch-stack.ts            
│       ├── security-monitoring/security-monitoring-stack.ts
│       ├── vpn/client-vpn-stack.ts         
│       ├── dns/route53-stack.ts            
│       ├── observability/observability-stack.ts
│       └── poc/poc-stack.ts
│
├── config/                                 # 環境別設定
│   ├── environment.ts                      # 設定インターフェース定義
│   ├── dev.ts
│   ├── stg.ts
│   ├── prod.ts
│   └── index.ts
│
├── test/                                   # テスト
│   ├── test-config.ts
│   ├── construct/
│   ├── resource/
│   └── stack/
│
└── lambda/                                 # Lambda 関数コード
    ├── index.js
    └── slack-notifier/index.js             # セキュリティアラートSlack通知
```

---

## スタック構成

### 必須スタック（8 スタック）

| # | Stack | 責務 | 変更頻度 | デプロイ時間 | 依存先 |
|---|-------|------|---------|------------|--------|
| 1 | FoundationStack | VPC, サブネット, NAT GW | 年1回 | 3-5分 | なし |
| 2 | DataStorageStack | RDS/Aurora, DynamoDB, Bastion | 月1回 | 5-10分 | Foundation |
| 3 | ObjectStorageStack | S3 | 稀 | 1-2分 | なし |
| 4 | SecurityStack | Cognito, Secrets Manager | 月1回 | 3-5分 | Foundation |
| 5 | BackendStack | ECS Fargate, ALB, Lambda, API GW, ECR | 週1回 | 5-7分 | Foundation, DataStorage, Security |
| 6 | FrontendStack | Amplify / S3+CloudFront / ECS(URL出力) | 日次 | 3-5分 | Backend |
| 7 | IntegrationStack | SNS, SQS, DLQ, SES | 月1回 | 2-3分 | Foundation |
| 8 | ObservabilityStack | CloudWatch Alarms, Dashboard | 月1回 | 2-3分 | 全スタック |

### オプションスタック

| Stack | 責務 | 有効化 |
|-------|------|--------|
| SecurityMonitoringStack | CloudTrail セキュリティ監査ログ・アラート | `config.securityMonitoring.enabled` |
| BatchStack | ECS Scheduled Task (EventBridge) | `config.batch.enabled` |
| ClientVpnStack | AWS Client VPN Endpoint | `config.clientVpn.enabled` |
| Route53Stack | 既存ホストゾーンへの DNS レコード追加 | `config.route53.enabled` |
| PocStack | PoC 向け AllInOne 構成 | `bin/poc-app.ts` で個別デプロイ |

### 依存関係

```
FoundationStack ─────────────────────────────────────────┐
    │                                                     │
    ├─→ DataStorageStack ──┐                              │
    │                      │                              │
    ├─→ SecurityStack ─────┤                              │
    │                      │                              │
    │                      ├─→ BackendStack ──→ FrontendStack
    │                      │        │
    ├─→ IntegrationStack   │        ├─→ BatchStack (optional)
    │                      │        ├─→ ClientVpnStack (optional)
    └──────────────────────┴────────┴─→ ObservabilityStack

ObjectStorageStack (独立)
SecurityMonitoringStack (独立) ← CloudTrail + SNS + Lambda(Slack)
Route53Stack → Backend, Frontend
```

---

## オプション機能

### SecurityMonitoring（CloudTrail セキュリティ監査）

CloudTrail による API 操作の記録・改ざん防止・リアルタイムアラート。他スタックへの依存なし。

```typescript
// config/prod.ts
securityMonitoring: {
  enabled: true,
  slackWebhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXX',
  logRetentionDays: 365,                     // CloudWatch Logs 保持期間
  glacierTransitionDays: 90,                 // S3 → Glacier 移行日数
  deepArchiveTransitionDays: 365,            // S3 → Deep Archive 移行日数
  enableDashboard: true,                     // CloudWatch Dashboard
},
```

通知フロー:
```
CloudTrail → EventBridge Rule (ログ改ざん検知) → SNS Topic → Lambda → Slack
CloudTrail → CloudWatch Logs → MetricFilter → Alarm → SNS Topic → Lambda → Slack
```

検知対象:
- **ログ改ざん**: StopLogging, DeleteTrail, UpdateTrail, DeleteBucket, PutBucketPolicy 等
- **不正アクセス**: Root ログイン, MFA 未使用ログイン, AccessDenied スパイク

### Client VPN

VPN 経由で ALB にアクセスする閉域接続。相互証明書認証。

```typescript
// config/dev.ts
clientVpn: {
  enabled: true,
  serverCertificateArn: 'arn:aws:acm:...',
  clientCertificateArn: 'arn:aws:acm:...',
  clientCidrBlock: '10.100.0.0/16',
  splitTunnel: true,
},
```

前提: ACM にサーバー/クライアント証明書をインポート済みであること。

### ECS フロントエンド

BackendStack の同一 ALB 上にフロントエンド用 ECS Fargate を追加し、パスベースルーティングで分離。VPN 閉域環境でのフロントエンド配信に最適。

```typescript
// config/dev.ts
frontend: {
  type: 'ecs',
  ecsContainerPort: 80,
  ecsBackendPathPatterns: ['/api/*', '/health'],
},
```

ALB ルーティング:
- `/api/*`, `/health` → バックエンド ECS (FastAPI)
- それ以外 → フロントエンド ECS (nginx 等)

### Route 53

既存パブリックホストゾーンに ALB / CloudFront 向けエイリアス A レコードを追加。ホストゾーンの新規作成は含まない。

```typescript
// config/dev.ts
route53: {
  enabled: true,
  hostedZoneId: 'Z1234567890ABC',
  zoneName: 'example.com',
  albRecordNames: ['api'],
  cloudFrontRecordName: 'app', // s3-cloudfront 時のみ
},
```

---

## フロントエンド配信方式

| 方式 | 用途 | 設定 |
|------|------|------|
| Amplify | 標準的な Web アプリ配信 | `frontend.type: 'amplify'` |
| S3 + CloudFront | カスタマイズ性が必要な場合 | `frontend.type: 's3-cloudfront'` |
| ECS (同一ALB) | VPN 閉域配信、SSR | `frontend.type: 'ecs'` |

---

## 環境別設定

| 項目 | dev | stg | prod |
|------|-----|-----|------|
| VPC CIDR | 10.0.0.0/16 | 10.2.0.0/16 | 10.1.0.0/16 |
| AZ 数 | 1 | 2 | 2 |
| NAT Gateway | 1 | 2 | 2 |
| DB | RDS t3.micro | RDS t3.medium (Multi-AZ) | Aurora r6g.large |
| ECS vCPU/Memory | 0.25/512MB | 0.5/1GB | 1.0/2GB |
| ECS タスク数 | 1 (1-2) | 2 (2-4) | 4 (2-10) |
| WAF | 無効 | 無効 | オプション |
| Bastion | 有効 | 有効 | オプション |

設定ファイル: `config/dev.ts`, `config/stg.ts`, `config/prod.ts`

---

## 関連ドキュメント

- [アーキテクチャ図](../docs/architecture/cdk-architecture.drawio) - draw.io 形式
- [リソース一覧](../docs/architecture/cdk-resources.md) - 全リソースの詳細
- [CI/CD ガイド](../.claude/rules/operations/CI_CD_GUIDE.md) - GitHub Actions パイプライン
- [PoC セットアップ](../.claude/rules/operations/POC_SETUP_GUIDE.md) - PoC AllInOne 構成
- [DB 変更ガイド](../.claude/rules/operations/DATABASE_CHANGE.md) - DB エンジン変更手順
- [カスタマイズガイド](../.claude/rules/operations/CUSTOMIZATION.md) - プロジェクト固有設定

---

**最終更新**: 2026-04-04
**バージョン**: 3.1.0
