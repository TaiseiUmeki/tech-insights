"""create article schema

Revision ID: 20260624_0001
Revises:
Create Date: 2026-06-24 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '20260624_0001'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.execute(
        """
        CREATE TABLE categories (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(64) NOT NULL,
            CONSTRAINT uq_categories_name UNIQUE (name)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE authors (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            CONSTRAINT uq_authors_name UNIQUE (name)
        )
        """
    )

    op.execute(
        """
        CREATE TABLE articles (
            id BIGSERIAL PRIMARY KEY,
            source_article_id INTEGER,
            category_id BIGINT NOT NULL,
            author_id BIGINT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            embedding vector(384),
            published_at TIMESTAMPTZ NOT NULL,
            CONSTRAINT uq_articles_source_article_id UNIQUE (source_article_id),
            CONSTRAINT fk_articles_category_id
                FOREIGN KEY (category_id)
                REFERENCES categories(id)
                ON DELETE RESTRICT,
            CONSTRAINT fk_articles_author_id
                FOREIGN KEY (author_id)
                REFERENCES authors(id)
                ON DELETE RESTRICT
        )
        """
    )

    op.execute('CREATE INDEX idx_articles_published_at ON articles (published_at DESC)')
    op.execute(
        'CREATE INDEX idx_articles_category_published_at '
        'ON articles (category_id, published_at DESC)'
    )
    op.execute(
        'CREATE INDEX idx_articles_author_published_at '
        'ON articles (author_id, published_at DESC)'
    )
    op.execute('CREATE INDEX idx_articles_title ON articles (title)')
    op.execute(
        """
        CREATE INDEX idx_articles_full_text
        ON articles USING GIN (
            to_tsvector('simple', title || ' ' || content)
        )
        """
    )
    op.execute(
        """
        CREATE INDEX idx_articles_embedding_hnsw
        ON articles USING hnsw (embedding vector_cosine_ops)
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('DROP INDEX IF EXISTS idx_articles_embedding_hnsw')
    op.execute('DROP INDEX IF EXISTS idx_articles_full_text')
    op.execute('DROP INDEX IF EXISTS idx_articles_title')
    op.execute('DROP INDEX IF EXISTS idx_articles_author_published_at')
    op.execute('DROP INDEX IF EXISTS idx_articles_category_published_at')
    op.execute('DROP INDEX IF EXISTS idx_articles_published_at')
    op.execute('DROP TABLE IF EXISTS articles')
    op.execute('DROP TABLE IF EXISTS authors')
    op.execute('DROP TABLE IF EXISTS categories')
