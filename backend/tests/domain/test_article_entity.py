"""記事ドメインエンティティのテスト"""

from datetime import UTC, datetime

from app.domain.entities.article import Article, Author, Category


def test_article_entity_holds_article_attributes():
    category = Category(id=1, name='Backend')
    author = Author(id=1, name='Sato')
    published_at = datetime(2025, 1, 1, tzinfo=UTC)

    article = Article(
        id=1,
        source_article_id=101,
        category_id=category.id,
        author_id=author.id,
        title='PostgreSQL search design',
        content='Keyword and semantic search notes.',
        embedding=[0.1, 0.2],
        published_at=published_at,
    )

    assert article.id == 1
    assert article.category_id == category.id
    assert article.author_id == author.id
    assert article.published_at == published_at
