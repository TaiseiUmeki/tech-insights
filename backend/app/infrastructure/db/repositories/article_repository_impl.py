from datetime import datetime
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.orm import Session, joinedload

from app.domain.entities.article import Article, Author, Category
from app.domain.repositories.article_repository import (
    IArticleRepository,
    IAuthorRepository,
    ICategoryRepository,
)
from app.infrastructure.db.models.article_model import (
    ArticleModel,
    AuthorModel,
    CategoryModel,
)


class ArticleRepositoryImpl(IArticleRepository):
    """記事リポジトリの実装"""

    def __init__(self, session: Session):
        self.session = session

    def list_articles(
        self,
        page: int,
        limit: int,
        category_id: int | None = None,
        author_id: int | None = None,
        sort: str = 'publishedAt',
        order: str = 'desc',
    ) -> dict[str, Any]:
        query = self._base_query()
        query = self._apply_filters(query, category_id, author_id)

        total = query.count()
        sort_column = ArticleModel.title if sort == 'title' else ArticleModel.published_at
        query = query.order_by(
            sort_column.asc() if order == 'asc' else sort_column.desc()
        )

        models = query.offset((page - 1) * limit).limit(limit).all()
        return {
            'items': [self._to_list_dict(model, None) for model in models],
            'page': page,
            'limit': limit,
            'total': total,
        }

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
        if search_mode == 'keyword':
            return self._keyword_search(q, page, limit, category_id, author_id)
        if search_mode == 'semantic':
            if query_embedding is None:
                return {'items': [], 'page': page, 'limit': limit, 'total': 0}
            return self._semantic_search(
                query_embedding, page, limit, category_id, author_id
            )
        if query_embedding is None:
            return self._keyword_search(q, page, limit, category_id, author_id)
        return self._hybrid_search(
            q, query_embedding, page, limit, category_id, author_id
        )

    def get_by_id(self, article_id: int) -> Article | None:
        model = (
            self.session.query(ArticleModel).filter(ArticleModel.id == article_id).first()
        )
        if model is None:
            return None
        return self._to_entity(model)

    def get_detail_dict(self, article_id: int) -> dict[str, Any] | None:
        model = self._base_query().filter(ArticleModel.id == article_id).first()
        if model is None:
            return None
        return {
            'id': model.id,
            'source_article_id': model.source_article_id,
            'title': model.title,
            'content': model.content,
            'category': {'id': model.category.id, 'name': model.category.name},
            'author': {'id': model.author.id, 'name': model.author.name},
            'published_at': model.published_at,
        }

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
        category = self._get_or_create_category(category_name)
        author = self._get_or_create_author(author_name)

        model = ArticleModel(
            source_article_id=source_article_id,
            category_id=category.id,
            author_id=author.id,
            title=title,
            content=content,
            embedding=embedding,
            published_at=published_at,
        )
        self.session.add(model)
        self.session.flush()
        return self._to_entity(model)

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
        model = (
            self.session.query(ArticleModel).filter(ArticleModel.id == article_id).first()
        )
        if model is None:
            return None

        category = self._get_or_create_category(category_name)
        author = self._get_or_create_author(author_name)

        model.category_id = category.id
        model.author_id = author.id
        model.title = title
        model.content = content
        model.published_at = published_at
        if embedding is not None:
            model.embedding = embedding

        self.session.flush()
        return self._to_entity(model)

    def delete(self, article_id: int) -> bool:
        model = (
            self.session.query(ArticleModel).filter(ArticleModel.id == article_id).first()
        )
        if model is None:
            return False
        self.session.delete(model)
        self.session.flush()
        return True

    def find_related(
        self, article_id: int, embedding: list[float], limit: int
    ) -> list[dict[str, Any]]:
        sql = text(
            """
            SELECT
                a.id,
                a.source_article_id,
                a.title,
                a.content,
                a.published_at,
                c.id AS category_id,
                c.name AS category_name,
                au.id AS author_id,
                au.name AS author_name,
                1 - (a.embedding <=> CAST(:embedding AS vector)) AS score
            FROM articles a
            JOIN categories c ON c.id = a.category_id
            JOIN authors au ON au.id = a.author_id
            WHERE a.id != :article_id
              AND a.embedding IS NOT NULL
            ORDER BY a.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """
        )
        rows = self.session.execute(
            sql,
            {
                'article_id': article_id,
                'embedding': self._vector_text(embedding),
                'limit': limit,
            },
        ).mappings()
        return [self._row_to_list_dict(row) for row in rows]

    def _keyword_search(
        self,
        q: str,
        page: int,
        limit: int,
        category_id: int | None,
        author_id: int | None,
    ) -> dict[str, Any]:
        rows = self._keyword_candidates(q, category_id, author_id, limit, page)
        total = self._keyword_count(q, category_id, author_id)
        return {
            'items': [self._row_to_list_dict(row) for row in rows],
            'page': page,
            'limit': limit,
            'total': total,
        }

    def _semantic_search(
        self,
        embedding: list[float],
        page: int,
        limit: int,
        category_id: int | None,
        author_id: int | None,
    ) -> dict[str, Any]:
        rows = self._semantic_candidates(embedding, category_id, author_id, limit, page)
        total = self._semantic_count(category_id, author_id)
        return {
            'items': [self._row_to_list_dict(row) for row in rows],
            'page': page,
            'limit': limit,
            'total': total,
        }

    def _hybrid_search(
        self,
        q: str,
        embedding: list[float],
        page: int,
        limit: int,
        category_id: int | None,
        author_id: int | None,
    ) -> dict[str, Any]:
        candidate_limit = max(limit * 5, page * limit * 5)
        keyword_rows = self._keyword_candidates(
            q, category_id, author_id, candidate_limit, 1
        )
        semantic_rows = self._semantic_candidates(
            embedding, category_id, author_id, candidate_limit, 1
        )

        merged: dict[int, dict[str, Any]] = {}
        for rank, row in enumerate(keyword_rows, start=1):
            item = dict(row)
            item['rrf_score'] = 1 / (60 + rank)
            merged[item['id']] = item

        for rank, row in enumerate(semantic_rows, start=1):
            item = merged.get(row['id'], dict(row))
            item['rrf_score'] = item.get('rrf_score', 0) + 1 / (60 + rank)
            item['score'] = item['rrf_score']
            merged[item['id']] = item

        ordered = sorted(
            merged.values(),
            key=lambda item: (item.get('rrf_score', 0), item.get('published_at')),
            reverse=True,
        )
        start = (page - 1) * limit
        page_items = ordered[start : start + limit]
        return {
            'items': [self._row_to_list_dict(row) for row in page_items],
            'page': page,
            'limit': limit,
            'total': len(ordered),
        }

    def _keyword_candidates(
        self,
        q: str,
        category_id: int | None,
        author_id: int | None,
        limit: int,
        page: int,
    ) -> list[dict[str, Any]]:
        sql = text(
            """
            SELECT
                a.id,
                a.source_article_id,
                a.title,
                a.content,
                a.published_at,
                c.id AS category_id,
                c.name AS category_name,
                au.id AS author_id,
                au.name AS author_name,
                (
                    ts_rank_cd(
                        to_tsvector('simple', a.title || ' ' || a.content),
                        websearch_to_tsquery('simple', :q)
                    )
                    + GREATEST(similarity(a.title, :q), similarity(a.content, :q)) * 0.2
                ) AS score
            FROM articles a
            JOIN categories c ON c.id = a.category_id
            JOIN authors au ON au.id = a.author_id
            WHERE (
                to_tsvector('simple', a.title || ' ' || a.content)
                    @@ websearch_to_tsquery('simple', :q)
                OR a.title % :q
                OR a.content % :q
            )
              AND (:category_id IS NULL OR a.category_id = :category_id)
              AND (:author_id IS NULL OR a.author_id = :author_id)
            ORDER BY score DESC, a.published_at DESC
            LIMIT :limit OFFSET :offset
            """
        )
        rows = self.session.execute(
            sql,
            {
                'q': q,
                'category_id': category_id,
                'author_id': author_id,
                'limit': limit,
                'offset': (page - 1) * limit,
            },
        ).mappings()
        return [dict(row) for row in rows]

    def _keyword_count(
        self, q: str, category_id: int | None, author_id: int | None
    ) -> int:
        sql = text(
            """
            SELECT COUNT(*) AS total
            FROM articles a
            WHERE (
                to_tsvector('simple', a.title || ' ' || a.content)
                    @@ websearch_to_tsquery('simple', :q)
                OR a.title % :q
                OR a.content % :q
            )
              AND (:category_id IS NULL OR a.category_id = :category_id)
              AND (:author_id IS NULL OR a.author_id = :author_id)
            """
        )
        return int(
            self.session.execute(
                sql, {'q': q, 'category_id': category_id, 'author_id': author_id}
            ).scalar()
            or 0
        )

    def _semantic_candidates(
        self,
        embedding: list[float],
        category_id: int | None,
        author_id: int | None,
        limit: int,
        page: int,
    ) -> list[dict[str, Any]]:
        sql = text(
            """
            SELECT
                a.id,
                a.source_article_id,
                a.title,
                a.content,
                a.published_at,
                c.id AS category_id,
                c.name AS category_name,
                au.id AS author_id,
                au.name AS author_name,
                1 - (a.embedding <=> CAST(:embedding AS vector)) AS score
            FROM articles a
            JOIN categories c ON c.id = a.category_id
            JOIN authors au ON au.id = a.author_id
            WHERE a.embedding IS NOT NULL
              AND (:category_id IS NULL OR a.category_id = :category_id)
              AND (:author_id IS NULL OR a.author_id = :author_id)
            ORDER BY a.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit OFFSET :offset
            """
        )
        rows = self.session.execute(
            sql,
            {
                'embedding': self._vector_text(embedding),
                'category_id': category_id,
                'author_id': author_id,
                'limit': limit,
                'offset': (page - 1) * limit,
            },
        ).mappings()
        return [dict(row) for row in rows]

    def _semantic_count(self, category_id: int | None, author_id: int | None) -> int:
        sql = text(
            """
            SELECT COUNT(*) AS total
            FROM articles a
            WHERE a.embedding IS NOT NULL
              AND (:category_id IS NULL OR a.category_id = :category_id)
              AND (:author_id IS NULL OR a.author_id = :author_id)
            """
        )
        return int(
            self.session.execute(
                sql, {'category_id': category_id, 'author_id': author_id}
            ).scalar()
            or 0
        )

    def _base_query(self):
        return self.session.query(ArticleModel).options(
            joinedload(ArticleModel.category),
            joinedload(ArticleModel.author),
        )

    def _apply_filters(self, query, category_id: int | None, author_id: int | None):
        if category_id is not None:
            query = query.filter(ArticleModel.category_id == category_id)
        if author_id is not None:
            query = query.filter(ArticleModel.author_id == author_id)
        return query

    def _get_or_create_category(self, name: str) -> CategoryModel:
        normalized = name.strip()
        model = (
            self.session.query(CategoryModel)
            .filter(func.lower(CategoryModel.name) == normalized.lower())
            .first()
        )
        if model is not None:
            return model
        model = CategoryModel(name=normalized)
        self.session.add(model)
        self.session.flush()
        return model

    def _get_or_create_author(self, name: str) -> AuthorModel:
        normalized = name.strip()
        model = (
            self.session.query(AuthorModel)
            .filter(func.lower(AuthorModel.name) == normalized.lower())
            .first()
        )
        if model is not None:
            return model
        model = AuthorModel(name=normalized)
        self.session.add(model)
        self.session.flush()
        return model

    def _to_entity(self, model: ArticleModel) -> Article:
        embedding = (
            model.embedding.tolist()
            if hasattr(model.embedding, 'tolist')
            else model.embedding
        )
        return Article(
            id=model.id,
            source_article_id=model.source_article_id,
            category_id=model.category_id,
            author_id=model.author_id,
            title=model.title,
            content=model.content,
            embedding=embedding,
            published_at=model.published_at,
        )

    def _to_list_dict(self, model: ArticleModel, score: float | None) -> dict[str, Any]:
        return {
            'id': model.id,
            'source_article_id': model.source_article_id,
            'title': model.title,
            'snippet': self._snippet(model.content),
            'category': {'id': model.category.id, 'name': model.category.name},
            'author': {'id': model.author.id, 'name': model.author.name},
            'published_at': model.published_at,
            'score': score,
        }

    def _row_to_list_dict(self, row: dict[str, Any]) -> dict[str, Any]:
        return {
            'id': row['id'],
            'source_article_id': row['source_article_id'],
            'title': row['title'],
            'snippet': self._snippet(row['content']),
            'category': {'id': row['category_id'], 'name': row['category_name']},
            'author': {'id': row['author_id'], 'name': row['author_name']},
            'published_at': row['published_at'],
            'score': float(row['score']) if row.get('score') is not None else None,
        }

    def _snippet(self, content: str) -> str:
        if len(content) <= 160:
            return content
        return f'{content[:157]}...'

    def _vector_text(self, vector: list[float]) -> str:
        return '[' + ','.join(str(value) for value in vector) + ']'


class CategoryRepositoryImpl(ICategoryRepository):
    """カテゴリリポジトリの実装"""

    def __init__(self, session: Session):
        self.session = session

    def list_categories(self, q: str | None = None) -> list[Category]:
        query = self.session.query(CategoryModel)
        if q:
            query = query.filter(CategoryModel.name.ilike(f'%{q}%'))
        models = query.order_by(CategoryModel.name.asc()).all()
        return [Category(id=model.id, name=model.name) for model in models]


class AuthorRepositoryImpl(IAuthorRepository):
    """著者リポジトリの実装"""

    def __init__(self, session: Session):
        self.session = session

    def list_authors(self, q: str | None = None) -> list[Author]:
        query = self.session.query(AuthorModel)
        if q:
            query = query.filter(AuthorModel.name.ilike(f'%{q}%'))
        models = query.order_by(AuthorModel.name.asc()).all()
        return [Author(id=model.id, name=model.name) for model in models]
