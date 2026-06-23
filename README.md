# AI Solution Template

**Next.js 15 + FastAPI + AWS CDK** で構築されたエンタープライズグレードのフルスタックテンプレート

## 📖 プロジェクト概要

このリポジトリは、受託の新規プロジェクトを素早く立ち上げるための開発基盤テンプレートです。

### 🎯 このリポジトリの役割

- **フロントエンド**: Next.js 15 (App Router) + FSD アーキテクチャ
- **バックエンド**: FastAPI + オニオンアーキテクチャ
- **インフラ**: AWS CDK + 4層レイヤードアーキテクチャ
- **CI/CD**: GitHub Actions + AWS OIDC

### 技術スタック

#### Frontend

- **Next.js 15.3.2** (App Router) + **React 19.2.0** + **TypeScript 5.4.5**
- **shadcn/ui** + **Tailwind CSS 3.4.3**
- **Redux Toolkit 2.2.0** (グローバル状態管理)
- **TanStack React Query 5.28.0** (サーバー状態管理)
- **React Hook Form 7.51.0** + **Zod 3.22.4** (フォーム管理)

#### Backend

- **FastAPI** + **Python 3.11+**
- **PostgreSQL 15**
- **JWT 認証** (RS256)
- **SQLAlchemy** (ORM)

#### Infrastructure

- **Docker** + **Docker Compose**
- **AWS CDK** (TypeScript)
- **GitHub Actions**

---

### アクセス

起動後、以下の URL にアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050

> Postgres は `pgvector/pgvector:pg15` を使用しており、ベクトル拡張 (`CREATE EXTENSION vector`) が初回起動時に自動有効化されます。既存ボリュームを使い続ける場合は手動で `CREATE EXTENSION IF NOT EXISTS vector;` を実行してください。

#### オプションサービス（コメントアウトで有効化）

以下はテンプレートに同梱されていますが、`docker-compose.yml` で**コメントアウトされている**ため標準では起動しません。プロジェクトで使うことが決まった時点で、対応する4ファイルのコメントを外してください。

| サービス | 用途 | アクセス先 |
| --- | --- | --- |
| **Redis** | キャッシュ / セッション / レート制限 / 非同期タスクのブローカー | `redis://localhost:6379` |
| **MinIO** | S3互換ストレージ（本番の AWS S3 に対応） | Console `http://localhost:9001` (ID/PW: `minioadmin` / `minioadmin`) |
| **ElasticMQ** | SQS互換キュー（本番の AWS SQS に対応） | UI `http://localhost:9325` |

各サービスを有効化する手順（例: Redis）:

1. `docker-compose.yml` の `# ---- Redis: ... ----` ブロックのコメントを外す
2. `backend/.env.example`（および手元の `.env`）の `# REDIS_URL=...` のコメントを外す
3. `backend/requirements.txt` の `# redis[hiredis]==...` のコメントを外す
4. `backend/app/config.py` の `# redis_url: ...` フィールドのコメントを外す
5. `docker compose up -d` で再起動

MinIO / ElasticMQ も同様に `# ---- MinIO ----` / `# ---- ElasticMQ ----` ブロックと、関連する `AWS_*` / `S3_*` / `SQS_*` 設定のコメントを外して有効化します。

### 開発環境のセットアップ

#### pre-commit（コミット前チェック）

```bash
# pre-commit をインストール
pip install pre-commit

# hooks をインストール
pre-commit install
```

これにより以下が有効になります：

- **main/master ブランチへの直接コミット禁止**
- **git-secrets による秘密情報の検出**

#### git-secrets（秘密情報の保護）

```bash
# macOS
brew install git-secrets

# セットアップスクリプトを実行
tools/setup-git-secrets.sh
```

検出される秘密情報：

- AWS 認証情報（Access Key ID, Secret Access Key）
- Anthropic API Key（`sk-ant-api...`）
- OpenAI API Key（`sk-...`）

---

## 📚 ドキュメント構成

ドキュメントは **3つの責務** で整理されています。

### 📐 アーキテクチャ設計 ([`docs/rules/architecture`](./docs/rules/architecture))

システムの設計思想と構造を理解するためのドキュメント

- **[フロントエンド](./docs/rules/architecture/FRONTEND.md)** - FSD アーキテクチャ、レイヤー構成
- **[バックエンド](./docs/rules/architecture/BACKEND.md)** - オニオンアーキテクチャ、依存関係ルール
- **[インフラ](./docs/rules/architecture/INFRASTRUCTURE.md)** - 4層レイヤードアーキテクチャ、スタック構成

### 💻 開発ガイド ([`docs/rules/development`](./docs/rules/development))

実装方法とコーディング規約のドキュメント

- **[フロントエンド開発](./docs/rules/development/FRONTEND.md)** - 環境構築、開発フロー、API連携
- **[バックエンド開発](./docs/rules/development/BACKEND.md)** - 実装済み機能、開発の流れ
- **[テスト](./docs/rules/development/TESTING.md)** - ユニットテスト、結合テスト

### ⚙️ 運用・セットアップ ([`docs/rules/operations`](./docs/rules/operations))

デプロイ、カスタマイズ、運用のドキュメント

- **[カスタマイズガイド](./docs/rules/operations/CUSTOMIZATION.md)** - 新規プロジェクト開始時必読
- **[PoCセットアップ](./docs/rules/operations/POC_SETUP_GUIDE.md)** - PoC Stack構成
- **[CI/CDガイド](./docs/rules/operations/CI_CD_GUIDE.md)** - GitHub Actionsワークフロー
- **[CI/CDセットアップ](./docs/rules/operations/CI_CD_SETUP.md)** - AWS OIDC設定
- **[データベース変更ガイド](./docs/rules/operations/DATABASE_CHANGE.md)** - DB種類の変更手順
- **[リビジョン履歴](./docs/revision/)** - テンプレートの変更履歴（日付別）

---

## 📂 ディレクトリ構成

```
ai-solution-template/
├── frontend/          # Next.js フロントエンド
│   └── README.md      # フロントエンド固有のドキュメント
├── backend/           # FastAPI バックエンド
│   └── README.md      # バックエンド固有のドキュメント
├── infra/             # AWS CDK インフラ定義
│   └── README.md      # インフラ固有のドキュメント
├── .github/
│   └── workflows/     # GitHub Actions ワークフロー
│       └── README.md  # CI/CD固有のドキュメント
├── docs/              # プロジェクト全体のドキュメント
│   └── rules/         # ルール・ガイドライン
│       ├── architecture/  # アーキテクチャ設計
│       ├── development/   # 開発ガイド
│       └── operations/    # 運用・セットアップ
└── README.md          # このファイル
```

各ディレクトリの詳細は、それぞれのREADME.mdを参照してください：

- **[frontend/README.md](./frontend/README.md)** - フロントエンド開発
- **[backend/README.md](./backend/README.md)** - バックエンド開発
- **[infra/README.md](./infra/README.md)** - インフラ管理
- **[.github/workflows/README.md](./.github/workflows/README.md)** - CI/CD設定

---

## 💻 開発コマンド（Taskfile）

プロジェクトルートで `task` または `task --list` を実行すると全コマンドを確認できます。

> [Taskfile](https://taskfile.dev) を使用しています。インストール: `brew install go-task/tap/go-task`

### Docker

| コマンド     | 説明                               |
| ------------ | ---------------------------------- |
| `task up`    | 全サービスをバックグラウンドで起動 |
| `task down`  | 全サービスを停止                   |
| `task build` | Dockerイメージをビルド             |
| `task logs`  | ログをリアルタイム表示             |

### 開発

| コマンド           | 説明                                     |
| ------------------ | ---------------------------------------- |
| `task test`        | テスト実行（Backend）                    |
| `task test-all`    | テスト実行（Backend + Frontend）         |
| `task lint`        | Lint（Backend）                          |
| `task lint-all`    | Lint（Backend + Frontend）               |
| `task format`      | Format（Backend）                        |
| `task format-all`  | Format（Backend + Frontend）             |
| `task onion-check` | オニオンアーキテクチャの依存関係チェック |

### クリーンアップ

| コマンド             | 説明                                  |
| -------------------- | ------------------------------------- |
| `task clean`         | キャッシュ・一時ファイル削除          |
| `task docker-clean`  | Docker作成ファイル削除（.next等）     |

### データベース

| コマンド                            | 説明                           |
| ----------------------------------- | ------------------------------ |
| `task db-migrate -- 'message'`      | マイグレーションファイルを作成 |
| `task db-upgrade`                   | マイグレーションを適用         |

### セキュリティ

| コマンド                 | 説明                   |
| ------------------------ | ---------------------- |
| `task generate-rsa-keys` | JWT用のRSA鍵ペアを生成 |

---

## 🎨 このテンプレートをカスタマイズする

新しいプロジェクトを開始する際は、以下のドキュメントを参照してください：

**[カスタマイズガイド](./docs/rules/operations/CUSTOMIZATION.md)**

---

## 📖 API仕様

- **Swagger UI**: http://localhost:8000/docs
- **OpenAPI 仕様書**: [openapi.json](./backend/documents/api/openapi.json)
- **Swagger HTML**: [swagger.html](./backend/documents/api/swagger.html)

main ブランチへの push 時、`backend/app/presentation/`配下のファイルが変更されると、GitHub Actions によって自動的にドキュメントが更新されます。

---

**最終更新**: 2026-02-11
**バージョン**: 3.0.0
