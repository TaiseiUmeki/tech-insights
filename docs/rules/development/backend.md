---
paths: backend/**
---
# バックエンド開発ガイド

## 目次

1. [はじめに](#はじめに)
2. [データベース](#データベース)
3. [API](#api)
4. [実装済み機能](#実装済み機能)

---

## はじめに

このガイドでは、AI Solution Template を使った実践的な開発方法を説明します。

### 前提条件

- バックエンドアーキテクチャガイドの DDD ベースのオニオンアーキテクチャを理解していること
- Python、Postgres（MySQL）の基本知識があること
- 開発プロジェクトの DB 設計および API 設計が完了していること

---

## データベース

DB 設計が完了したら、バックエンドにコードを記述します。

### 手順

1. `app/infrastructure/db/models/` に必要なテーブルを記述する。
   - コメントアウトされた例を参考にしてください。
   - インデックスなどの細かい設定は、パフォーマンス改善が必要になったタイミングで後から追加できます。
2. `app/infrastructure/db/models/__init__.py` を作成し、手順1で定義したすべてのモデルをインポートする。
3. `backend/alembic/env.py` の29行目以降で、すべてのモデルをインポートする。
   - これにより alembic が差分を自動検出できるようになります。
4. これらの定義を実際の DB（本番またはローカル）に反映する。

- **ローカル環境**（Docker 上で DB を実行）:

  1. task コマンドで差分を検出し、マイグレーションファイルを作成する:
     ```bash
     task db-migrate -- 'hogehoge message'
     ```
  2. 作成されたマイグレーションファイルを必ず目視で確認する（手動修正が必要なことが多い!）。
  3. マイグレーションを実行する:
     ```bash
     task db-upgrade
     ```
  - **マイグレーション作成者以外のチームメンバー向け**: docker-compose.yml の `migrator` サービスが Docker 起動時に `task db-upgrade` 相当の処理を自動実行するため、マイグレーション履歴が自動的に同期されます。

- **本番環境**（AWS など）:
  - ローカルの手順に加えて、自動デプロイワークフローで DB の接続先が本番環境に正しく更新されていることを確認してください。
  - 注意: デプロイ先の DB スペックによっては、ローカルと比べて I/O が極端に遅くなることがあるため、マイグレーション時の N+1 問題に注意してください。

---

## API

- API 設計が完了したら、バックエンドアーキテクチャガイドに従って実装する
- `POST /login` などのエンドポイントは実装済みです。その他の実装例についてはチームに確認してください。

### API ドキュメント

- main ブランチへの push（マージ）時に `app/presentation/` に変更がある場合、Swagger UI による API ドキュメントが自動生成されます。
- 実装: `.github/workflows/update-swagger.yml`
- 出力先: `backend/documents/api/`

---

## 実装済み機能

### 1. ディレクトリ構成

- オニオンアーキテクチャのディレクトリ構成が事前に作成済み
- この構成に従って開発を進めてください

### 2. ログイン機能

- 3つの API が実装済み:
  - POST /api/auth/login
    - `login_id = admin`、`password = pass` でログイン
    - `access_token` は RSA 暗号化を使用して生成
    - `backend/app/infrastructure/security/security_service_impl.py` の User スキーマを適切な場所・フィールドに変更してください。トークンの内容も必要に応じて変更してください。
    - 生成されたトークンはバックエンドによって Cookie に設定されます
  - POST /api/auth/logout
    - Cookie を削除する標準的なログアウト機能
  - GET /api/auth/status
    - 依存性注入で `current_user` が取得できれば認証完了

### 3. ユーザー CRUD 機能

- 7つの API が実装済み:
  - POST /users - ユーザー作成
  - GET /users - ユーザー一覧（ページネーション付き）
  - GET /users/me - 現在のユーザー情報取得
  - PUT /users/me/password - 自身のパスワード変更
  - GET /users/{user_id} - ユーザー詳細取得
  - PUT /users/{user_id} - ユーザー更新
  - DELETE /users/{user_id} - ユーザー削除
- すべてのエンドポイントで認証が必要（`get_current_user_from_cookie`）
- ドメイン例外（`business_exceptions.py`）は `presentation/handlers.py` を介して HTTP レスポンスに変換されます

### 4. Alembic セットアップ

- 初期セットアップは完了済みですが、マイグレーションファイルはまだ作成されていません
- `task db-migrate -- 'hoge'` でマイグレーションファイルを作成し、DB に反映できます
- チーム開発では、マイグレーションファイルの同時作成によりリビジョンの競合が発生する可能性があります
  - マージで解消できますが、チーム内で連携してバージョン履歴をリニアに保つことを推奨します

### 5. ビルドチェック & フォーマットチェック CI/CD

- デフォルトでは、main ブランチへの PR 作成時にビルドチェックとフォーマットチェックの CI が実行されます（`.github/workflows/backend-ci.yml`）
- PR 作成前にローカルで task コマンドを実行し、CI が通ることを確認することを推奨します
- Ruff の設定はプロジェクトに合わせて適宜調整してください
