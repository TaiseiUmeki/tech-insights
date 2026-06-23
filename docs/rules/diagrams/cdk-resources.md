# AWS CDK リソース一覧

## スタック構成

| # | Stack | 目的 | 変更頻度 | デプロイ時間 | 依存先 |
|---|-------|------|---------|------------|--------|
| 1 | **FoundationStack** | VPC・ネットワーク基盤 | 年1回 | 3-5分 | なし |
| 2 | **DataStorageStack** | データベース | 月1回 | 5-10分 | Foundation |
| 3 | **ObjectStorageStack** | S3オブジェクトストレージ | 稀 | 1-2分 | なし |
| 4 | **SecurityStack** | 認証・シークレット管理 | 月1回 | 3-5分 | Foundation |
| 5 | **BackendStack** | ECS/Lambda API実行環境 | 週1回 | 5-7分 | Foundation, DataStorage, Security |
| 6 | **FrontendStack** | フロントエンド配信 | 日次 | 3-5分 | Backend |
| 7 | **IntegrationStack** | メッセージング（SNS/SQS） | 月1回 | 2-3分 | Foundation |
| 8 | **BatchStack** | バッチ処理（条件付き） | 月1回 | 3-5分 | Foundation, DataStorage |
| 9 | **SecurityMonitoringStack** | セキュリティ監査（条件付き） | 稀 | 3-5分 | なし（独立） |
| 10 | **ClientVpnStack** | VPN接続（条件付き） | 稀 | 3-5分 | Foundation, Backend |
| 11 | **Route53Stack** | DNS（条件付き） | 稀 | 1-2分 | Backend, Frontend |
| 12 | **ObservabilityStack** | 監視・アラート | 月1回 | 2-3分 | 全スタック（任意） |

---

## リソース詳細

### FoundationStack

| リソース | サービス | 説明 |
|---------|---------|------|
| VPC | Amazon VPC | 環境別CIDR: dev=10.0.0.0/16, stg=10.2.0.0/16, prod=10.1.0.0/16 |
| Public Subnets | VPC Subnet | AZ毎（dev=1AZ, stg/prod=2AZ） |
| Private Subnets | VPC Subnet | AZ毎（dev=1AZ, stg/prod=2AZ） |
| Internet Gateway | VPC IGW | パブリックサブネット用 |
| NAT Gateway | VPC NAT GW | dev=1, stg/prod=2 |
| Isolation SG | Security Group | 緊急隔離用 |
| Isolation NACL | Network ACL | 緊急隔離用 |
| VPC Endpoints | VPC Endpoint | S3 (Gateway), ECR, Logs, Secrets Manager (Interface) |

### DataStorageStack

| リソース | サービス | 条件 | 環境別スペック |
|---------|---------|------|--------------|
| RDS Instance | Amazon RDS PostgreSQL | `enableRds` | dev: t3.micro/20GB, stg: t3.medium/100GB (Multi-AZ), prod: Multi-AZ |
| Bastion Host | EC2 (SSM) | `bastion.enabled` && DB存在 | SSM Session Manager経由 |

### ObjectStorageStack

| リソース | サービス | 説明 |
|---------|---------|------|
| Data Bucket | Amazon S3 | パブリックアクセスブロック、SSE-S3暗号化、バージョニング有効 |

### SecurityStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| User Pool | Amazon Cognito | 常時 | SMS MFA対応（オプション） |
| User Pool Client | Cognito Client | 常時 | アプリ統合用 |
| Secret | Secrets Manager | 常時 | DB認証情報格納 |

### BackendStack

| リソース | サービス | 条件 | 環境別スペック |
|---------|---------|------|--------------|
| ECS Cluster | Amazon ECS | 常時 | Fargate起動タイプ |
| Fargate Service | ECS Service | 常時 | dev: 1台, stg: 2台, prod: 4台 |
| Task Definition | ECS Task | 常時 | dev: 0.25vCPU/512MB, stg: 0.5vCPU/1GB, prod: 1vCPU/2GB |
| ALB | Elastic LB | 常時 | Multi-AZ（stg/prod） |
| ECR Repository | Amazon ECR | 常時 | MUTABLEタグ |
| Lambda Function | AWS Lambda | `config.lambda` | VPC内配置 |
| API Gateway | Amazon API GW | Lambda有効時 | REST/HTTP API |
| WAF | AWS WAF | `waf.enabled` | OWASP Top 10, レート制限 2000req/5min |

### FrontendStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| S3 Bucket | Amazon S3 | `type='s3-cloudfront'` | プライベートバケット |
| CloudFront | Amazon CloudFront | `type='s3-cloudfront'` | OACベースアクセス |
| Amplify App | AWS Amplify | `type='amplify'` | Git連携自動デプロイ |
| （ECS フロント） | — | `type='ecs'` | コンテナ・ALB は **BackendStack** で定義。本スタックは URL 出力のみ |

`frontend.type='ecs'` のとき、フロント用 Fargate・ECR・ALB ルールは BackendStack（`ApiResource`）に作成され、同一 ALB でデフォルトパスはフロント ECS、`ecsBackendPathPatterns`（既定: `/api/*`, `/health`）はバックエンド ECS へ振り分けます。

### IntegrationStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| SNS Topic | Amazon SNS | 常時 | イベント通知 |
| SQS Queue | Amazon SQS | 常時 | メッセージキュー |
| Dead Letter Queue | Amazon SQS | 常時 | 失敗メッセージ退避 |
| SES Identity | Amazon SES | `ses.enabled` | メール送信 |

### BatchStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| EventBridge Rule | Amazon EventBridge | `batch.enabled` | Cronスケジュール |
| ECS Scheduled Task | ECS Task | `batch.enabled` | バッチ処理実行 |
| CloudWatch Log Group | CloudWatch Logs | `batch.enabled` | dev=7日, stg=30日, prod=90日保持 |

### SecurityMonitoringStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| CloudTrail Trail | AWS CloudTrail | `securityMonitoring.enabled` | 全リージョン対応、ログファイルバリデーション有効 |
| S3 Bucket | Amazon S3 | `securityMonitoring.enabled` | KMS暗号化、Glacier/Deep Archiveライフサイクル、削除Deny。Object Lockはデフォルト無効（configで有効化可） |
| CloudWatch Log Group | CloudWatch Logs | `securityMonitoring.enabled` | CloudTrailログのリアルタイム分析用（デフォルト90日保持） |
| SNS Topic | Amazon SNS | `securityMonitoring.enabled` | セキュリティアラート集約 |
| Lambda Function | AWS Lambda | `slackWebhookUrl` 指定時 | Slack通知用（128MB、10秒タイムアウト） |
| EventBridge Rule (ログ改ざん) | EventBridge | `securityMonitoring.enabled` | StopLogging, DeleteTrail, UpdateTrail, DeleteBucket等を検知 |
| MetricFilter + Alarm (Root Login) | CloudWatch | `securityMonitoring.enabled` | Rootアカウントログイン検知（閾値: 1回/5分） |
| MetricFilter + Alarm (MFAなし) | CloudWatch | `securityMonitoring.enabled` | MFA未使用ログイン検知（閾値: 1回/5分） |
| MetricFilter + Alarm (AccessDenied) | CloudWatch | `securityMonitoring.enabled` | アクセス拒否スパイク検知（閾値: 10回/5分） |
| CloudWatch Dashboard | CloudWatch | `enableDashboard` | セキュリティメトリクス可視化 |

### ClientVpnStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| Client VPN Endpoint | AWS Client VPN | `clientVpn.enabled` | 相互証明書認証、スプリットトンネル対応 |
| Security Group | EC2 SG | `clientVpn.enabled` | VPN用SG、ALB SGへのIngress(80/443)を追加 |
| Target Network Association | Client VPN | `clientVpn.enabled` | プライベートサブネットへの関連付け |
| Authorization Rule | Client VPN | `clientVpn.enabled` | パブリックサブネット（ALB配置先）へのアクセス許可（最小権限） |
| CloudWatch Log Group | CloudWatch Logs | `clientVpn.enabled` | VPN接続ログ（30日保持） |

### Route53Stack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| A Record (Alias) | Route 53 | `route53.enabled` | 既存パブリックホストゾーンを参照し、ALB 向けエイリアス（既定サブドメイン `api` など） |
| A Record (Alias) | Route 53 | `route53.enabled` かつ `frontend.type=s3-cloudfront` と `cloudFrontRecordName` | CloudFront 向けエイリアス |

ホストゾーンの**新規作成**は含まない。HTTPS 用カスタムドメインは ACM 証明書と ALB/CloudFront のドメイン設定が別途必要。

### ObservabilityStack

| リソース | サービス | 条件 | 説明 |
|---------|---------|------|------|
| Dashboard | CloudWatch Dashboard | 常時 | メトリクス集約 |
| ECS Alarms | CloudWatch Alarm | ECS存在時 | CPU/メモリ/タスク数 |
| RDS Alarms | CloudWatch Alarm | RDS存在時 | CPU使用率 |
| Lambda Alarms | CloudWatch Alarm | Lambda存在時 | 呼び出し/エラー/レイテンシ |
| ALB Alarms | CloudWatch Alarm | ALB存在時 | ターゲットヘルス |

---

## 依存関係グラフ

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

## 環境別リソース比較

| リソース | dev | stg | prod |
|---------|-----|-----|------|
| AZ数 | 1 | 2 | 2 |
| NAT Gateway | 1 | 2 | 2 |
| DB | RDS t3.micro | RDS t3.medium | RDS (Multi-AZ) |
| DB Multi-AZ | No | Yes | Yes (Standby) |
| ECS vCPU/Memory | 0.25/512MB | 0.5/1GB | 1.0/2GB |
| ECS タスク数 | 1 (1-2) | 2 (2-4) | 4 (2-10) |
| ALBログ | 無効 | 有効 (30日) | 有効 (90日) |
| WAF | 無効 | 無効 | オプション |
| Bastion | 有効 | 有効 | オプション |
| 月額コスト目安 | $30-50 | $100-150 | $200-400 |

---

生成日: 2026-04-03
