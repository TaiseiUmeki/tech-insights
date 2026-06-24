"""記事ユースケースのテスト"""

from unittest.mock import MagicMock

import pytest

from app.application.use_cases.article_usecase import ArticleUsecase
from app.domain.exceptions.business_exceptions import BusinessValidationError


def _usecase() -> tuple[ArticleUsecase, MagicMock, MagicMock]:
    article_repository = MagicMock()
    embedding_service = MagicMock()
    usecase = ArticleUsecase(
        article_repository=article_repository,
        embedding_service=embedding_service,
    )
    return usecase, article_repository, embedding_service


def test_list_articles_without_query_uses_plain_list():
    usecase, article_repository, embedding_service = _usecase()
    article_repository.list_articles.return_value = {
        'items': [],
        'page': 1,
        'limit': 12,
        'total': 0,
    }

    result = usecase.list_articles(
        page=1,
        limit=12,
        q='',
        search_mode='keyword',
        category_id=None,
        author_id=None,
        sort='publishedAt',
        order='desc',
    )

    assert result.total == 0
    article_repository.list_articles.assert_called_once()
    article_repository.search_articles.assert_not_called()
    embedding_service.embed_query.assert_not_called()


def test_list_articles_rejects_unknown_search_mode():
    usecase, _, _ = _usecase()

    with pytest.raises(BusinessValidationError):
        usecase.list_articles(
            page=1,
            limit=12,
            q='PostgreSQL',
            search_mode='unknown',
            category_id=None,
            author_id=None,
            sort='publishedAt',
            order='desc',
        )
