import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.application.interfaces.embedding_service import IEmbeddingService
from app.infrastructure.db.models.article_model import (
    ArticleModel,
    AuthorModel,
    CategoryModel,
)


class ArticleCsvImporter:
    """docs/articles.csv の初期取込"""

    def __init__(self, session: Session, embedding_service: IEmbeddingService):
        self.session = session
        self.embedding_service = embedding_service

    def import_if_needed(self, csv_path: str) -> int:
        path = Path(csv_path)
        if not path.exists():
            return 0

        rows = []
        with path.open(newline='', encoding='utf-8') as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                source_article_id = int(row['id'])
                exists = (
                    self.session.query(ArticleModel.id)
                    .filter(ArticleModel.source_article_id == source_article_id)
                    .first()
                )
                if exists:
                    continue
                rows.append(row)

        if not rows:
            return 0

        embeddings = self.embedding_service.embed_articles(
            [(row['title'], row['content']) for row in rows]
        )

        imported = 0
        for row, embedding in zip(rows, embeddings, strict=True):
            category = self._get_or_create_category(row['category'])
            author = self._get_or_create_author(row['author'])
            article = ArticleModel(
                source_article_id=int(row['id']),
                category_id=category.id,
                author_id=author.id,
                title=row['title'],
                content=row['content'],
                embedding=embedding,
                published_at=datetime.fromisoformat(row['published_at']),
            )
            self.session.add(article)
            imported += 1

        self.session.commit()
        return imported

    def _get_or_create_category(self, name: str) -> CategoryModel:
        normalized = name.strip()
        model = (
            self.session.query(CategoryModel)
            .filter(func.lower(CategoryModel.name) == normalized.lower())
            .first()
        )
        if model:
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
        if model:
            return model
        model = AuthorModel(name=normalized)
        self.session.add(model)
        self.session.flush()
        return model
