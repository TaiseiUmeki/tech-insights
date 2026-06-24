# TechInsight

AI 搭載型ナレッジベース「TechInsight」です。技術記事データを PostgreSQL に取り込み、記事の CRUD、キーワード検索、セマンティック検索、ハイブリッド検索をローカル環境で再現できる Web アプリケーションとして実装しています。

評価者が API キーを持っていない前提で、Docker Compose により Database、Backend API、Frontend をワンコマンドで起動できる構成です。

## 概要

| 分類 | 内容 |
|---|---|
| データ移行 | `docs/articles.csv` の 1,000 件の記事を初回起動時に DB へ取り込み |
| 記事管理 | 記事一覧、詳細表示、作成、編集、削除 |
| 検索 | キーワード検索、セマンティック検索、ハイブリッド検索 |
| AI/ML | ローカル embedding model による記事本文のベクトル化 |
| UI | `/articles` で記事一覧、検索、詳細/作成/編集/削除モーダルを提供 |
| API | FastAPI による RESTful API と OpenAPI / Swagger 仕様 |

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| Backend | Python 3.11、FastAPI、SQLAlchemy、Alembic、Pytest、Ruff |
| Frontend | Next.js 15、React 19、TypeScript、TanStack Query、nuqs、shadcn/ui、Jest |
| Database | PostgreSQL 15、pgvector、pg_trgm、Full Text Search |
| AI/ML | sentence-transformers、`intfloat/multilingual-e5-small` |
| Infrastructure | Docker Compose |

## 起動方法

### 前提条件

- Docker Desktop
- Docker Compose
- Taskfile を使う場合のみ `task`

### 起動

```bash
docker compose up
```

または:

```bash
task up
```

`docker compose up` では PostgreSQL / pgvector 起動、Alembic migration、`docs/articles.csv` の初期インポート、Backend API 起動、Frontend 起動を行います。

初回起動時は Docker image build、Python / npm 依存関係の取得、embedding model の取得に時間がかかる場合があります。

### アクセス先

| 用途 | URL |
|---|---|
| Frontend | http://localhost:3000/articles |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| pgAdmin | http://localhost:8080 |

pgAdmin の初期ログイン:

- Email: `admin@example.com`
- Password: `admin`

## 使い方

### 記事一覧・検索

`/articles` で記事一覧を表示できます。検索欄にキーワードまたは自然文を入力し、検索モードを切り替えて検索します。

| 検索モード | 用途 | 実装 |
|---|---|---|
| keyword | 明確な技術用語で探す | PostgreSQL Full Text Search + pg_trgm |
| semantic | 自然文の意味に近い記事を探す | pgvector cosine similarity |
| hybrid | 用語一致と意味的類似の両方で探す | keyword と semantic の RRF 融合 |

### モーダルURL

画面設計に合わせ、モーダル状態はURLクエリで表現します。

| URL | 表示 |
|---|---|
| `/articles` | 記事一覧・検索画面 |
| `/articles?articleId={id}` | 記事詳細モーダル |
| `/articles?modal=create` | 記事作成モーダル |
| `/articles?articleId={id}&modal=edit` | 記事編集モーダル |
| `/articles?articleId={id}&modal=delete` | 削除確認ダイアログ |

## API

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/articles` | 記事一覧取得、検索 |
| POST | `/api/articles` | 記事作成 |
| GET | `/api/articles/{articleId}` | 記事詳細取得 |
| PUT | `/api/articles/{articleId}` | 記事更新 |
| DELETE | `/api/articles/{articleId}` | 記事削除 |
| GET | `/api/articles/{articleId}/related-articles` | 関連記事取得 |
| GET | `/api/categories` | カテゴリ一覧取得 |
| GET | `/api/authors` | 著者一覧取得 |

API 仕様:

- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: [backend/documents/api/openapi.json](./backend/documents/api/openapi.json)
- Swagger HTML: [backend/documents/api/swagger.html](./backend/documents/api/swagger.html)

## 設計方針

### UI/UX

- 一覧、検索、詳細、作成、編集、削除を `/articles` 中心で操作できる構成にしています。
- 詳細、作成、編集、削除モーダルはURLクエリと同期します。
- 編集時の著者・カテゴリは既存マスタから選択します。
- 検索結果 0 件、API エラー、読み込み中の状態を画面上で扱います。

### DB

- `articles`、`categories`、`authors` を分け、カテゴリ名や著者名をマスタとして扱います。
- CSV 再投入時の冪等性は `source_article_id` で担保します。
- 論理削除は採用せず、記事削除は物理削除で行います。
- 1 万件程度への増加を想定し、BTREE、GIN、HNSW index を利用します。
- セマンティック検索用 embedding は `articles.embedding vector(384)` に保存します。

### チーム開発

- Backend は Onion Architecture に沿って、domain、application、infrastructure、presentation を分離しています。
- Frontend は Feature-Sliced Design に沿って、shared、entities、features、widgets、page-components、app を分離しています。
- API 仕様は FastAPI から OpenAPI として生成し、Frontend / Backend 間の契約を確認しやすくしています。

## 開発・検証コマンド

| コマンド | 内容 |
|---|---|
| `task up` | Docker Compose で起動 |
| `task down` | Docker Compose を停止 |
| `task build` | Docker image を build |
| `task logs` | コンテナログを表示 |
| `task db-upgrade` | Alembic migration を開発DBへ適用 |
| `task db-upgrade-test` | Alembic migration をテストDBへ適用 |
| `task db-upgrade-all` | Alembic migration を開発DBとテストDBへ適用 |
| `task test` | Backend の pytest を実行 |
| `task test-all` | Backend pytest と Frontend Jest を実行 |
| `task lint` | Backend の Ruff check を実行 |
| `task onion-check` | Onion Architecture 依存関係チェック |

CI 相当の確認:

```bash
docker compose exec backend ruff check .
docker compose exec backend ruff format --check .
docker compose run --rm backend python scripts/check_onion_architecture.py
docker compose exec backend pytest -v

docker compose exec frontend npm run type-check
docker compose exec frontend npm test -- --ci
docker compose exec -e NODE_ENV=production frontend npm run build

bash frontend/scripts/check-showcase-sync.sh
```

Backend の pytest は `ai_solution_test_db` を使用します。テストDBは pytest または
`task db-upgrade-test` 実行時に作成され、Alembic migration で開発DBと同じ schema に揃えます。
開発DB `ai_solution_db` に対して `Base.metadata.drop_all()` は実行しません。

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [docs/テスト要件.md](./docs/テスト要件.md) | コーディング試験の要件 |
| [docs/requirements/要件定義書.md](./docs/requirements/要件定義書.md) | 機能要件 |
| [docs/requirements/DB設計書.md](./docs/requirements/DB設計書.md) | DB 設計 |
| [docs/requirements/API設計書.md](./docs/requirements/API設計書.md) | API 設計 |
| [docs/requirements/画面設計書.md](./docs/requirements/画面設計書.md) | 画面設計 |
| [docs/requirements/検索アルゴリズム.md](./docs/requirements/検索アルゴリズム.md) | 検索方式とアルゴリズム |
| [docs/requirements/アーキテクチャ設計書.md](./docs/requirements/アーキテクチャ設計書.md) | Backend / Frontend 詳細設計 |

## ディレクトリ構成

```text
coding_test/
├── backend/              # FastAPI Backend
├── frontend/             # Next.js Frontend
├── docs/
│   ├── articles.csv      # 初期投入用CSV
│   ├── テスト要件.md
│   └── requirements/     # 要件定義、DB設計、API設計、画面設計
├── tools/                # PostgreSQL 初期化などの補助スクリプト
├── docker-compose.yml
├── Taskfile.yml
└── README.md
```

## 補足

- 外部 API キーは不要です。
- ユーザー認証・認可、本番クラウドデプロイ、権限管理は今回の対象外です。
