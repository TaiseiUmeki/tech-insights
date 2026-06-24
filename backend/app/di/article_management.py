from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.article_usecase import ArticleUsecase
from app.infrastructure.db.repositories.article_repository_impl import (
    ArticleRepositoryImpl,
    AuthorRepositoryImpl,
    CategoryRepositoryImpl,
)
from app.infrastructure.db.session import get_db
from app.infrastructure.embedding.local_embedding_service import LocalEmbeddingService


def get_article_usecase(db: Session = Depends(get_db)) -> ArticleUsecase:
    article_repository = ArticleRepositoryImpl(db)
    category_repository = CategoryRepositoryImpl(db)
    author_repository = AuthorRepositoryImpl(db)
    embedding_service = LocalEmbeddingService()
    return ArticleUsecase(
        article_repository=article_repository,
        category_repository=category_repository,
        author_repository=author_repository,
        embedding_service=embedding_service,
    )
