-- pgvector 拡張を有効化（埋め込みベクトルの保存・類似検索に使用）
-- このファイルは Postgres の初回起動時に自動実行される。
-- 既存ボリュームの場合は手動で実行する必要あり: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;
