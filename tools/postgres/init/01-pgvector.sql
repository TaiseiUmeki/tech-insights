-- pgvector 拡張を有効化（埋め込みベクトルの保存・類似検索に使用）
-- このファイルは Postgres の初回起動時に自動実行される。
-- 既存ボリュームの場合は手動で実行する必要あり: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;

-- pytest が開発DBを破壊しないよう、同一PostgreSQL内にテスト専用DBを用意する。
-- 既存ボリュームではこのinit scriptは再実行されないため、pytest fixture側でも未作成時に作成する。
CREATE DATABASE ai_solution_test_db;
