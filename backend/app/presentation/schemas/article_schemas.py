from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.application.schemas.article_schemas import (
    ArticleDetailDTO,
    ArticleListDTO,
    ArticleListItemDTO,
    AuthorDTO,
    CategoryDTO,
    ReindexJobDTO,
)


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class CategoryResponse(CamelModel):
    id: int
    name: str

    @classmethod
    def from_dto(cls, dto: CategoryDTO) -> 'CategoryResponse':
        return cls(id=dto.id, name=dto.name)


class AuthorResponse(CamelModel):
    id: int
    name: str

    @classmethod
    def from_dto(cls, dto: AuthorDTO) -> 'AuthorResponse':
        return cls(id=dto.id, name=dto.name)


class ArticleListItemResponse(CamelModel):
    id: int
    source_article_id: int | None = Field(None, alias='sourceArticleId')
    title: str
    snippet: str
    category: CategoryResponse
    author: AuthorResponse
    published_at: datetime = Field(..., alias='publishedAt')
    score: float | None = None

    @classmethod
    def from_dto(cls, dto: ArticleListItemDTO) -> 'ArticleListItemResponse':
        return cls(
            id=dto.id,
            source_article_id=dto.source_article_id,
            title=dto.title,
            snippet=dto.snippet,
            category=CategoryResponse.from_dto(dto.category),
            author=AuthorResponse.from_dto(dto.author),
            published_at=dto.published_at,
            score=dto.score,
        )


class ArticleListResponse(CamelModel):
    items: list[ArticleListItemResponse]
    page: int
    limit: int
    total: int

    @classmethod
    def from_dto(cls, dto: ArticleListDTO) -> 'ArticleListResponse':
        return cls(
            items=[ArticleListItemResponse.from_dto(item) for item in dto.items],
            page=dto.page,
            limit=dto.limit,
            total=dto.total,
        )


class ArticleDetailResponse(CamelModel):
    id: int
    source_article_id: int | None = Field(None, alias='sourceArticleId')
    title: str
    content: str
    category: CategoryResponse
    author: AuthorResponse
    published_at: datetime = Field(..., alias='publishedAt')

    @classmethod
    def from_dto(cls, dto: ArticleDetailDTO) -> 'ArticleDetailResponse':
        return cls(
            id=dto.id,
            source_article_id=dto.source_article_id,
            title=dto.title,
            content=dto.content,
            category=CategoryResponse.from_dto(dto.category),
            author=AuthorResponse.from_dto(dto.author),
            published_at=dto.published_at,
        )


class ArticleUpsertRequest(CamelModel):
    title: str = Field(..., max_length=255)
    content: str
    author_name: str = Field(..., alias='authorName')
    category_name: str = Field(..., alias='categoryName')
    published_at: datetime = Field(..., alias='publishedAt')


class CategoryListResponse(CamelModel):
    items: list[CategoryResponse]


class AuthorListResponse(CamelModel):
    items: list[AuthorResponse]


class DeleteArticleResponse(CamelModel):
    id: int
    deleted: bool


class ReindexJobRequest(CamelModel):
    article_id: int = Field(..., alias='articleId')


class ReindexJobResponse(CamelModel):
    id: str
    status: str
    target_count: int = Field(..., alias='targetCount')
    processed_count: int = Field(..., alias='processedCount')
    failed_count: int = Field(..., alias='failedCount')

    @classmethod
    def from_dto(cls, dto: ReindexJobDTO) -> 'ReindexJobResponse':
        return cls(
            id=dto.id,
            status=dto.status,
            target_count=dto.target_count,
            processed_count=dto.processed_count,
            failed_count=dto.failed_count,
        )
