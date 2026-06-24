"""pytest共通設定とフィクスチャ"""

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from alembic import command
from alembic.config import Config

DEFAULT_TEST_DATABASE_URL = (
    'postgresql+psycopg2://app_user:app_password@db:5432/ai_solution_test_db'
)
TEST_DATABASE_URL = os.getenv('TEST_DATABASE_URL')
if not TEST_DATABASE_URL:
    TEST_DATABASE_URL = (
        os.getenv('DATABASE_URL')
        if os.getenv('STAGE') == 'test' and os.getenv('DATABASE_URL')
        else DEFAULT_TEST_DATABASE_URL
    )


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _ensure_test_database_exists() -> None:
    url = make_url(TEST_DATABASE_URL)
    database_name = url.database
    if not database_name:
        raise RuntimeError('TEST_DATABASE_URL must include a database name')

    admin_url = url.set(database='postgres')
    admin_engine = create_engine(admin_url, isolation_level='AUTOCOMMIT')
    try:
        with admin_engine.connect() as connection:
            exists = connection.execute(
                text('SELECT 1 FROM pg_database WHERE datname = :database_name'),
                {'database_name': database_name},
            ).scalar()
            if not exists:
                connection.execute(
                    text(f'CREATE DATABASE {_quote_identifier(database_name)}')
                )
    finally:
        admin_engine.dispose()


def _run_test_migrations() -> None:
    previous_url = os.environ.get('ALEMBIC_DATABASE_URL')
    os.environ['ALEMBIC_DATABASE_URL'] = TEST_DATABASE_URL
    try:
        alembic_config = Config('alembic.ini')
        command.upgrade(alembic_config, 'head')
    finally:
        if previous_url is None:
            os.environ.pop('ALEMBIC_DATABASE_URL', None)
        else:
            os.environ['ALEMBIC_DATABASE_URL'] = previous_url


def _truncate_test_tables(engine) -> None:
    with engine.begin() as connection:
        connection.execute(
            text('TRUNCATE TABLE articles, authors, categories RESTART IDENTITY')
        )


@pytest.fixture(scope='session')
def test_db_engine():
    """テスト用DBエンジン（セッションスコープ）"""
    _ensure_test_database_exists()
    _run_test_migrations()
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_database(request) -> Generator[None, None, None]:
    """DBを使うテストだけ、テストデータを初期化する"""
    if not {'db_session', 'test_client'} & set(request.fixturenames):
        yield
        return

    test_db_engine = request.getfixturevalue('test_db_engine')
    _truncate_test_tables(test_db_engine)
    yield
    _truncate_test_tables(test_db_engine)


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


@pytest.fixture(scope='session')
def test_client(test_db_engine) -> Generator[TestClient, None, None]:
    """FastAPI TestClient（セッションスコープ）"""
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
