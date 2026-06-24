import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# .envファイルを環境変数に設定（ローカル開発環境用）
# 本番環境では環境変数が直接設定されるため、.envファイルは不要
if os.path.exists('.env'):
    load_dotenv('.env')


class Settings(BaseSettings):
    upload_folder: str = 'uploads'
    postgres_host: str = 'db'
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_port: int = 5432
    stage: str = 'development'  # デフォルトは開発環境
    database_url: str = ''
    auto_import_articles: bool = False
    articles_csv_path: str = 'docs/articles.csv'
    embedding_model_name: str = 'intfloat/multilingual-e5-small'
    search_candidate_multiplier: int = 5

    # 認証機能の有効/無効
    enable_auth: bool = True

    # JWT settings
    jwt_expiration_hours: str = '24'
    jwt_algorithm: str = 'RS256'  # RS256 for RSA, HS256 for HMAC (deprecated)
    jwt_private_key: str = ''  # RSA private key for signing (RS256)
    jwt_public_key: str = ''  # RSA public key for verification (RS256)

    # ---- Optional: docker-compose.yml で対応サービスを有効化したらコメントを外す ----
    # AWS / S3 (MinIO in local) — endpoint_url が空なら本物の AWS S3 を使う
    # aws_region: str = 'ap-northeast-1'
    # aws_access_key_id: str = ''
    # aws_secret_access_key: str = ''
    # aws_s3_endpoint_url: str = ''
    # s3_bucket_name: str = ''

    # AWS / SQS (ElasticMQ in local) — endpoint_url が空なら本物の AWS SQS を使う
    # aws_sqs_endpoint_url: str = ''
    # sqs_queue_url: str = ''

    # Redis (キャッシュ / セッション / レート制限 / 非同期タスクのブローカー)
    # redis_url: str = 'redis://redis:6379/0'

    # 一旦これだけ書いてる
    class Config:
        env_file = '.env'
        extra = 'ignore'  # 未定義のフィールドを無視（後方互換性のため）


@lru_cache
def get_settings():
    """@lru_cacheで.envの結果をキャッシュする"""
    return Settings()
