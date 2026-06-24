from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.article_usecase import ArticleUsecase
from app.application.use_cases.author_usecase import AuthorUsecase
from app.application.use_cases.category_usecase import CategoryUsecase
from app.application.use_cases.reindex_usecase import ReindexUsecase
from app.infrastructure.db.repositories.article_repository_impl import (
    ArticleRepositoryImpl,
    AuthorRepositoryImpl,
    CategoryRepositoryImpl,
)
from app.infrastructure.db.session import get_db
from app.infrastructure.embedding.local_embedding_service import LocalEmbeddingService


def get_article_usecase(db: Session = Depends(get_db)) -> ArticleUsecase:
    article_repository = ArticleRepositoryImpl(db)
    embedding_service = LocalEmbeddingService()
    return ArticleUsecase(
        article_repository=article_repository,
        embedding_service=embedding_service,
    )


def get_category_usecase(db: Session = Depends(get_db)) -> CategoryUsecase:
    return CategoryUsecase(category_repository=CategoryRepositoryImpl(db))


def get_author_usecase(db: Session = Depends(get_db)) -> AuthorUsecase:
    return AuthorUsecase(author_repository=AuthorRepositoryImpl(db))


def get_reindex_usecase(db: Session = Depends(get_db)) -> ReindexUsecase:
    article_repository = ArticleRepositoryImpl(db)
    embedding_service = LocalEmbeddingService()
    return ReindexUsecase(
        article_repository=article_repository,
        embedding_service=embedding_service,
    )
