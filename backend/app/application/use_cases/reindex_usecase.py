from app.application.interfaces.embedding_service import IEmbeddingService
from app.application.schemas.article_schemas import ReindexJobDTO
from app.domain.exceptions.business_exceptions import (
    BusinessLogicError,
    ResourceNotFoundError,
)
from app.domain.repositories.article_repository import IArticleRepository


class ReindexUsecase:
    """検索index再生成ユースケース"""

    def __init__(
        self,
        article_repository: IArticleRepository,
        embedding_service: IEmbeddingService,
    ):
        self.article_repository = article_repository
        self.embedding_service = embedding_service

    def reindex(self, article_id: int | None = None) -> ReindexJobDTO:
        if article_id is None:
            raise BusinessLogicError(
                '全件再生成はCSV再投入または管理スクリプトで行います'
            )
        article = self.article_repository.get_by_id(article_id)
        if article is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')
        detail = self.article_repository.get_detail_dict(article_id)
        if detail is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')
        embedding = self.embedding_service.embed_article(article.title, article.content)
        self.article_repository.update(
            article_id=article.id,
            title=article.title,
            content=article.content,
            author_name=detail['author']['name'],
            category_name=detail['category']['name'],
            published_at=article.published_at,
            embedding=embedding,
        )
        return ReindexJobDTO(
            id=f'article_{article_id}',
            status='completed',
            target_count=1,
            processed_count=1,
            failed_count=0,
        )
