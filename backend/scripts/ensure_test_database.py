#!/usr/bin/env python3
import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

DEFAULT_TEST_DATABASE_URL = (
    'postgresql+psycopg2://app_user:app_password@db:5432/ai_solution_test_db'
)


def quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def get_test_database_url() -> str:
    return os.getenv('TEST_DATABASE_URL') or DEFAULT_TEST_DATABASE_URL


def main() -> None:
    test_database_url = get_test_database_url()
    url = make_url(test_database_url)
    database_name = url.database
    if not database_name:
        raise RuntimeError('TEST_DATABASE_URL must include a database name')

    admin_url = url.set(database='postgres')
    engine = create_engine(admin_url, isolation_level='AUTOCOMMIT')
    try:
        with engine.connect() as connection:
            exists = connection.execute(
                text('SELECT 1 FROM pg_database WHERE datname = :database_name'),
                {'database_name': database_name},
            ).scalar()
            if exists:
                print(f'Test database already exists: {database_name}')
                return
            connection.execute(text(f'CREATE DATABASE {quote_identifier(database_name)}'))
            print(f'Created test database: {database_name}')
    finally:
        engine.dispose()


if __name__ == '__main__':
    main()
