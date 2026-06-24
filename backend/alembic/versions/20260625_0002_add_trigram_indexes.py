"""add trigram indexes

Revision ID: 20260625_0002
Revises: 20260624_0001
Create Date: 2026-06-25 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '20260625_0002'
down_revision: str | None = '20260624_0001'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_articles_title_trgm
        ON articles USING GIN (title gin_trgm_ops)
        """
    )
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_articles_content_trgm
        ON articles USING GIN (content gin_trgm_ops)
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute('DROP INDEX IF EXISTS idx_articles_content_trgm')
    op.execute('DROP INDEX IF EXISTS idx_articles_title_trgm')
