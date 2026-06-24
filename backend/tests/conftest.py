"""pytest共通設定とフィクスチャ"""

import os
from collections.abc import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.application.interfaces.security_service import ISecurityService
from app.domain.repositories.user_repository import IUserRepository
from app.infrastructure.db.models.article_model import (  # noqa: F401
    ArticleModel,
    AuthorModel,
    CategoryModel,
)
from app.infrastructure.db.models.base import Base
from app.infrastructure.db.models.user_model import UserModel  # noqa: F401

# テスト用DB URL（Docker環境のPostgreSQLを使用）
TEST_DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql+psycopg2://app_user:app_password@db:5432/ai_solution_db',
)


@pytest.fixture(scope='session')
def test_db_engine():
    """テスト用DBエンジン（セッションスコープ）"""
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    with engine.connect() as connection:
        connection.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
        connection.execute(text('CREATE EXTENSION IF NOT EXISTS pg_trgm'))
        connection.commit()
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope='function')
def db_session(test_db_engine) -> Generator[Session, None, None]:
    """テスト用DBセッション（各テストで独立・トランザクションrollback）"""
    connection = test_db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def mock_user_repository() -> MagicMock:
    """モックUserRepository"""
    return MagicMock(spec=IUserRepository)


@pytest.fixture
def mock_security_service() -> MagicMock:
    """モックSecurityService"""
    return MagicMock(spec=ISecurityService)


@pytest.fixture(scope='session')
def test_client(test_db_engine) -> Generator[TestClient, None, None]:
    """FastAPI TestClient（セッションスコープ）"""
    os.environ['ENABLE_AUTH'] = 'false'
    os.environ['AUTO_IMPORT_ARTICLES'] = 'false'

    from app.config import get_settings

    get_settings.cache_clear()

    from app.infrastructure.db.session import get_db
    from app.main import app

    TestSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_db_engine
    )

    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()
    get_settings.cache_clear()
