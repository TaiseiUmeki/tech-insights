from app.application.interfaces.embedding_service import IEmbeddingService
from app.application.schemas.article_schemas import (
    ArticleDetailDTO,
    ArticleInputDTO,
    ArticleListDTO,
    AuthorDTO,
    CategoryDTO,
    ReindexJobDTO,
)
from app.domain.exceptions.business_exceptions import (
    BusinessLogicError,
    BusinessValidationError,
    ResourceNotFoundError,
)
from app.domain.repositories.article_repository import (
    IArticleRepository,
    IAuthorRepository,
    ICategoryRepository,
)


class ArticleUsecase:
    """記事管理ユースケース"""

    def __init__(
        self,
        article_repository: IArticleRepository,
        category_repository: ICategoryRepository,
        author_repository: IAuthorRepository,
        embedding_service: IEmbeddingService,
    ):
        self.article_repository = article_repository
        self.category_repository = category_repository
        self.author_repository = author_repository
        self.embedding_service = embedding_service

    def list_articles(
        self,
        page: int,
        limit: int,
        q: str | None,
        search_mode: str,
        category_id: int | None,
        author_id: int | None,
        sort: str,
        order: str,
    ) -> ArticleListDTO:
        self._validate_page(page, limit)
        if search_mode not in {'keyword', 'semantic', 'hybrid'}:
            raise BusinessValidationError('searchMode が不正です')
        if sort not in {'publishedAt', 'title', 'relevance'}:
            raise BusinessValidationError('sort が不正です')
        if order not in {'asc', 'desc'}:
            raise BusinessValidationError('order が不正です')

        query = (q or '').strip()
        if not query:
            result = self.article_repository.list_articles(
                page=page,
                limit=limit,
                category_id=category_id,
                author_id=author_id,
                sort=sort if sort != 'relevance' else 'publishedAt',
                order=order,
            )
        else:
            query_embedding = None
            if search_mode in {'semantic', 'hybrid'}:
                query_embedding = self.embedding_service.embed_query(query)
            result = self.article_repository.search_articles(
                q=query,
                search_mode=search_mode,
                page=page,
                limit=limit,
                category_id=category_id,
                author_id=author_id,
                query_embedding=query_embedding,
            )
        return ArticleListDTO(**result)

    def get_article(self, article_id: int) -> ArticleDetailDTO:
        detail = self.article_repository.get_detail_dict(article_id)
        if detail is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')
        return ArticleDetailDTO(**detail)

    def create_article(self, input_dto: ArticleInputDTO) -> ArticleDetailDTO:
        self._validate_article_input(input_dto)
        embedding = self.embedding_service.embed_article(
            input_dto.title, input_dto.content
        )
        article = self.article_repository.create(
            title=input_dto.title,
            content=input_dto.content,
            author_name=input_dto.author_name,
            category_name=input_dto.category_name,
            published_at=input_dto.published_at,
            embedding=embedding,
        )
        return self.get_article(article.id)

    def update_article(
        self, article_id: int, input_dto: ArticleInputDTO
    ) -> ArticleDetailDTO:
        self._validate_article_input(input_dto)
        existing = self.article_repository.get_by_id(article_id)
        if existing is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')

        embedding = None
        if existing.title != input_dto.title or existing.content != input_dto.content:
            embedding = self.embedding_service.embed_article(
                input_dto.title, input_dto.content
            )

        updated = self.article_repository.update(
            article_id=article_id,
            title=input_dto.title,
            content=input_dto.content,
            author_name=input_dto.author_name,
            category_name=input_dto.category_name,
            published_at=input_dto.published_at,
            embedding=embedding,
        )
        if updated is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')
        return self.get_article(article_id)

    def delete_article(self, article_id: int) -> None:
        if not self.article_repository.delete(article_id):
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')

    def list_categories(self, q: str | None = None) -> list[CategoryDTO]:
        return [
            CategoryDTO(id=category.id, name=category.name)
            for category in self.category_repository.list_categories(q)
        ]

    def list_authors(self, q: str | None = None) -> list[AuthorDTO]:
        return [
            AuthorDTO(id=author.id, name=author.name)
            for author in self.author_repository.list_authors(q)
        ]

    def related_articles(self, article_id: int, limit: int) -> ArticleListDTO:
        if limit < 1 or limit > 20:
            raise BusinessValidationError('limit が不正です')
        article = self.article_repository.get_by_id(article_id)
        if article is None:
            raise ResourceNotFoundError(f'記事ID {article_id} が見つかりません')
        if article.embedding is None:
            raise BusinessLogicError('関連記事検索用のembeddingがありません')
        items = self.article_repository.find_related(article_id, article.embedding, limit)
        return ArticleListDTO(items=items, page=1, limit=limit, total=len(items))

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

    def _validate_page(self, page: int, limit: int) -> None:
        if page < 1:
            raise BusinessValidationError('page は 1 以上で指定してください')
        if limit < 1 or limit > 100:
            raise BusinessValidationError('limit は 1 以上 100 以下で指定してください')

    def _validate_article_input(self, input_dto: ArticleInputDTO) -> None:
        if not input_dto.title.strip():
            raise BusinessValidationError('タイトルは必須です')
        if len(input_dto.title) > 255:
            raise BusinessValidationError('タイトルは255文字以内で入力してください')
        if not input_dto.content.strip():
            raise BusinessValidationError('本文は必須です')
        if not input_dto.author_name.strip():
            raise BusinessValidationError('著者は必須です')
        if not input_dto.category_name.strip():
            raise BusinessValidationError('カテゴリは必須です')
