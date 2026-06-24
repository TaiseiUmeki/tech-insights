from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from app.domain.entities.article import Article, Author, Category


class IArticleRepository(ABC):
    """記事リポジトリのインターフェース"""

    @abstractmethod
    def list_articles(
        self,
        page: int,
        limit: int,
        category_id: int | None = None,
        author_id: int | None = None,
        sort: str = 'publishedAt',
        order: str = 'desc',
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def search_articles(
        self,
        q: str,
        search_mode: str,
        page: int,
        limit: int,
        category_id: int | None = None,
        author_id: int | None = None,
        query_embedding: list[float] | None = None,
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def get_by_id(self, article_id: int) -> Article | None:
        pass

    @abstractmethod
    def get_detail_dict(self, article_id: int) -> dict[str, Any] | None:
        pass

    @abstractmethod
    def create(
        self,
        title: str,
        content: str,
        author_name: str,
        category_name: str,
        published_at: datetime,
        embedding: list[float],
        source_article_id: int | None = None,
    ) -> Article:
        pass

    @abstractmethod
    def update(
        self,
        article_id: int,
        title: str,
        content: str,
        author_name: str,
        category_name: str,
        published_at: datetime,
        embedding: list[float] | None = None,
    ) -> Article | None:
        pass

    @abstractmethod
    def delete(self, article_id: int) -> bool:
        pass

    @abstractmethod
    def find_related(
        self, article_id: int, embedding: list[float], limit: int
    ) -> list[dict[str, Any]]:
        pass


class ICategoryRepository(ABC):
    """カテゴリリポジトリのインターフェース"""

    @abstractmethod
    def list_categories(self, q: str | None = None) -> list[Category]:
        pass


class IAuthorRepository(ABC):
    """著者リポジトリのインターフェース"""

    @abstractmethod
    def list_authors(self, q: str | None = None) -> list[Author]:
        pass
