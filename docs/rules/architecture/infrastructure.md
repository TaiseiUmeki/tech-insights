---
paths: infra/**
---
# インフラストラクチャ アーキテクチャガイド

## 目次

1. [概要](#概要)
2. [4層アーキテクチャ](#4層アーキテクチャ)
3. [プロジェクト構成](#プロジェクト構成)
4. [スタック構成](#スタック構成)
5. [ネットワーク設計](#ネットワーク設計)
6. [セキュリティ設計](#セキュリティ設計)
7. [オプション機能](#オプション機能)
8. [運用](#運用)
9. [CI/CD パイプライン](#cicd-パイプライン)

---

## 概要

AWS CDK (Cloud Development Kit) を使用した、**完全な4層アーキテクチャ**によるインフラ設計。

### プロジェクトの特徴

- **完全な4層構造**: Construct -> Resource -> Stack -> bin/
- **L2 コンストラクトのみ使用**: AWS ベストプラクティスに準拠（L1 例外: Client VPN - L2 が存在しないため）
- **デフォルトでセキュア**: すべてのリソースにセキュアな設定を適用
- **環境別設定**: dev/stg/prod の切り替えが容易
- **スケーラブル**: 小規模から大規模プロジェクトまで対応

---

## 4層アーキテクチャ

### アーキテクチャ概要

```
Layer 4: bin/app.ts                    <- どのスタックを使用するかを選択
    ↓
Layer 3: lib/stack/                    <- デプロイ単位（CloudFormation Stack）
    ↓
Layer 2: lib/resource/                 <- 機能単位（AWS サービスの組み合わせ）
    ↓
Layer 1: lib/construct/                <- 単一 AWS リソースの抽象化
    ↓
Layer 0: aws-cdk-lib                   <- AWS CDK 公式ライブラリ
```

### 依存ルール

- L1 → L0 のみ
- L2 → L1, L0 のみ
- L3 → L2, L1, L0 のみ
- L4 → すべてのレイヤー
- スタック間参照には `CfnSecurityGroupIngress` を使用し、循環依存を回避

---

## プロジェクト構成

```
infra/
├── bin/
│   ├── app.ts                              # L4: アプリケーションエントリポイント
│   └── poc-app.ts                          # L4: PoC エントリポイント
│
├── lib/
│   ├── construct/                          # L1: 単一 AWS リソースの抽象化
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
│   │       ├── cognito-construct.ts
│   │       ├── secrets-manager-construct.ts
│   │       └── waf-construct.ts
│   │
│   ├── resource/                           # L2: 機能単位の組み合わせ
│   │   ├── api-resource.ts
│   │   ├── data-storage-resource.ts
│   │   ├── database-resource.ts
│   │   ├── email-resource.ts
│   │   ├── frontend-resource.ts
│   │   ├── messaging-resource.ts
│   │   ├── network-resource.ts
│   │   ├── object-storage-resource.ts
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
│       ├── batch/batch-stack.ts            # オプション
│       ├── vpn/client-vpn-stack.ts         # オプション
│       ├── dns/route53-stack.ts            # オプション
│       ├── observability/observability-stack.ts
│       └── poc/poc-stack.ts
│
├── config/                                 # 環境別設定
│   ├── environment.ts
│   ├── dev.ts
│   ├── stg.ts
│   ├── prod.ts
│   └── index.ts
│
└── lambda/                                 # Lambda 関数コード
    └── index.js
```

---

## スタック構成

### 必須スタック（8スタック）

| Stack | 責務 | 変更頻度 | デプロイ時間 |
|-------|------|---------|-------------|
| FoundationStack | ネットワーク基盤（VPC、サブネット、NAT） | 年次 | 3-5 min |
| DataStorageStack | データベース（DynamoDB、RDS、Aurora、Bastion） | 月次 | 5-10 min |
| ObjectStorageStack | オブジェクトストレージ（S3） | まれ | 1-2 min |
| SecurityStack | 認証・シークレット（Cognito、Secrets Manager） | 月次 | 3-5 min |
| BackendStack | バックエンド API（ECS Fargate、ALB、Lambda、API GW、ECR）+ オプションのフロントエンド ECS | 週次 | 5-7 min |
| FrontendStack | フロントエンド配信（Amplify / S3+CloudFront / ECS URL 出力） | 日次 | 3-5 min |
| IntegrationStack | システム連携（SNS、SQS、DLQ、SES） | 月次 | 2-3 min |
| ObservabilityStack | 監視（CloudWatch Alarms、Dashboards） | 月次 | 2-3 min |

### オプションスタック

| Stack | 責務 | 有効化方法 |
|-------|------|----------|
| BatchStack | ECS スケジュールタスク（EventBridge cron） | `config.batch.enabled` |
| ClientVpnStack | AWS Client VPN エンドポイント（相互証明書認証） | `config.clientVpn.enabled` |
| Route53Stack | 既存ホストゾーンへの DNS エイリアスレコード | `config.route53.enabled` |
| PocStack | PoC/検証用（オールインワン） | `bin/poc-app.ts` 経由でデプロイ |

### フロントエンド配信モード

| Mode | Config | 説明 |
|------|--------|------|
| Amplify | `frontend.type: 'amplify'` | Git ベースの自動デプロイ（デフォルト） |
| S3 + CloudFront | `frontend.type: 's3-cloudfront'` | CDN を使用した静的ホスティング |
| ECS (same ALB) | `frontend.type: 'ecs'` | BackendStack の ALB 上の Fargate、パスベースルーティング。VPN 閉域網ユースケース |

### 分離のメリット

- **DB と S3 の独立管理**: 変更頻度や削除ポリシーが異なるリソースを分離
- **高速なフロントエンド更新**: 3-5分
- **バックエンド変更の影響なし**: API 更新時にフロントエンドは影響を受けない
- **独立デプロイ**: チームが並行して作業可能

---

## ネットワーク設計

### VPC サブネット構成

```
10.x.0.0/16 (VPC - CIDR は環境ごとに異なる)
├── 10.x.0.0/20   - Public Subnet (AZ-a)   <- ALB, NAT Gateway
├── 10.x.16.0/20  - Public Subnet (AZ-c)   <- ALB, NAT Gateway
├── 10.x.32.0/20  - Private Subnet (AZ-a)  <- ECS, Lambda, RDS, Client VPN
└── 10.x.48.0/20  - Private Subnet (AZ-c)  <- ECS, Lambda, RDS, Client VPN
```

### VPC エンドポイント

| Type | Service | コスト |
|------|---------|-------|
| Gateway | S3 | 無料 |
| Gateway | DynamoDB | 無料 |
| Interface | ECR API | 有料 |
| Interface | ECR Docker | 有料 |
| Interface | CloudWatch Logs | 有料 |
| Interface | Secrets Manager | 有料 |

### 環境別ネットワーク設定

| 環境 | VPC CIDR | AZ数 | NAT Gateway数 |
|------|----------|------|---------------|
| dev | 10.0.0.0/16 | 1 | 1 |
| stg | 10.2.0.0/16 | 2 | 2 |
| prod | 10.1.0.0/16 | 2 | 2 |

---

## セキュリティ設計

### セキュリティグループの分離

```
Internet (0.0.0.0/0)
    │ HTTP/HTTPS
    ▼
┌─────────────┐        ┌──────────────────┐
│     ALB     │ ←──────│  Client VPN      │ (オプション)
│   (SG-ALB)  │        │   (SG-VPN)       │
└─────────────┘        └──────────────────┘
    │ port 8000 (backend) / port 80 (frontend ECS)
    ▼
┌─────────────┐
│     ECS     │ ← ALB-SG からのみ許可
│   (SG-ECS)  │
└─────────────┘
    │ port 5432
    ▼
┌─────────────┐
│     RDS     │ ← ECS-SG, Lambda-SG からのみ許可
│   (SG-RDS)  │
└─────────────┘
```

### WAF (Web Application Firewall) - オプション

ALB および CloudFront に適用可能。`config.waf.enabled` で有効化。

| Rule | 保護内容 |
|------|---------|
| AWSManagedRulesCommonRuleSet | OWASP Top 10（XSS、LFI 等） |
| AWSManagedRulesKnownBadInputsRuleSet | 既知の悪意あるパターン |
| AWSManagedRulesSQLiRuleSet | SQL インジェクション |
| AWSManagedRulesAmazonIpReputationList | 悪意ある IP のブロック |
| RateLimitRule | DDoS 対策（2000 req/5min） |

### S3 セキュリティ

- パブリックアクセスの完全ブロック（`BLOCK_ALL`）
- サーバーサイド暗号化（S3-Managed）
- HTTPS の強制（`enforceSSL: true`）
- バージョニング有効（デフォルト）
- OAC（Origin Access Control）経由での CloudFront アクセス

### RDS/Aurora セキュリティ

- ストレージ暗号化
- VPC プライベートサブネットへの配置
- 自動バックアップ有効
- マイナーバージョン自動アップグレード: dev/stg は有効、prod は無効

---

## オプション機能

### Client VPN

相互証明書認証による ALB への VPN 接続。バックエンド API やフロントエンド ECS への閉域網アクセスを実現。

- **認証**: 相互証明書認証（ACM）
- **ルーティング**: プライベートサブネット（デフォルトでスプリットトンネル）
- **ログ**: CloudWatch Logs への接続ログ
- **SG ルール**: VPN SG → ALB SG（ポート 80/443）

前提条件: サーバー/クライアント証明書を ACM にインポート済みであること。

### ECS フロントエンド（同一 ALB）

BackendStack の ALB 上でフロントエンド Fargate サービスをパスベースルーティングで実行。

- デフォルトパス（`/`）→ フロントエンド ECS（nginx 等）
- API パス（`/api/*`, `/health`）→ バックエンド ECS（FastAPI）
- フロントエンドイメージ用の個別 ECR リポジトリ
- FrontendStack は URL を出力するのみ（リソースは BackendStack 内）

### Route 53 DNS

既存のパブリックホストゾーンにエイリアス A レコードを作成。ホストゾーン自体は作成しない。

- ALB エイリアスレコード（複数サブドメイン対応）
- CloudFront エイリアスレコード（`frontend.type: 's3-cloudfront'` の場合）

---

## 運用

### 踏み台ホスト

RDS/Aurora 接続用の踏み台サーバー。`config.bastion.enabled` で有効化。

| 方式 | 特徴 | 推奨環境 |
|------|------|---------|
| SSM Session Manager | SSH 不要、IAM 認証、監査ログ | すべての環境 |
| SSH | 従来方式、鍵管理が必要 | 開発環境のみ |

### DB 接続

```bash
# SSM 経由のポートフォワーディング
aws ssm start-session \
  --target i-xxxxxxxxxx \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["your-rds-endpoint"],"portNumber":["5432"],"localPortNumber":["5432"]}'
```

---

## CI/CD パイプライン

### GitHub Actions 認証

OIDC ベースのセキュアな認証:

- 長期的なアクセスキーが不要
- IAM ロールベースの一時的な認証情報
- 最小権限の原則を適用

### ECR デプロイ戦略

- **コミット SHA のみをタグとして使用**（`latest` タグは使わない）
- 不変なイメージ管理
- 容易なロールバック（過去のコミット SHA を指定するだけ）
- 監査証跡（本番環境でどのコミットが稼働しているか明確）

### デプロイフロー

```
develop branch -> Staging（自動デプロイ）
main branch    -> Production（自動デプロイまたは承認ベースのデプロイ）
```
