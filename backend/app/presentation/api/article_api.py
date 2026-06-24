from fastapi import APIRouter, Depends, Query, status

from app.application.schemas.article_schemas import ArticleInputDTO
from app.application.use_cases.article_usecase import ArticleUsecase
from app.di.article_management import get_article_usecase
from app.presentation.schemas.article_schemas import (
    ArticleDetailResponse,
    ArticleListResponse,
    ArticleUpsertRequest,
    DeleteArticleResponse,
)

article_router = APIRouter(prefix='/api/articles', tags=['記事'])


@article_router.get('', response_model=ArticleListResponse)
def list_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    q: str | None = Query(None),
    search_mode: str = Query('keyword', alias='searchMode'),
    category_id: int | None = Query(None, alias='categoryId'),
    author_id: int | None = Query(None, alias='authorId'),
    sort: str = Query('publishedAt'),
    order: str = Query('desc'),
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> ArticleListResponse:
    dto = usecase.list_articles(
        page=page,
        limit=limit,
        q=q,
        search_mode=search_mode,
        category_id=category_id,
        author_id=author_id,
        sort=sort,
        order=order,
    )
    return ArticleListResponse.from_dto(dto)


@article_router.post(
    '', response_model=ArticleDetailResponse, status_code=status.HTTP_201_CREATED
)
def create_article(
    request: ArticleUpsertRequest,
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> ArticleDetailResponse:
    dto = usecase.create_article(
        ArticleInputDTO(
            title=request.title,
            content=request.content,
            author_name=request.author_name,
            category_name=request.category_name,
            published_at=request.published_at,
        )
    )
    return ArticleDetailResponse.from_dto(dto)


@article_router.get('/{article_id}', response_model=ArticleDetailResponse)
def get_article(
    article_id: int,
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> ArticleDetailResponse:
    return ArticleDetailResponse.from_dto(usecase.get_article(article_id))


@article_router.put('/{article_id}', response_model=ArticleDetailResponse)
def update_article(
    article_id: int,
    request: ArticleUpsertRequest,
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> ArticleDetailResponse:
    dto = usecase.update_article(
        article_id,
        ArticleInputDTO(
            title=request.title,
            content=request.content,
            author_name=request.author_name,
            category_name=request.category_name,
            published_at=request.published_at,
        ),
    )
    return ArticleDetailResponse.from_dto(dto)


@article_router.delete('/{article_id}', response_model=DeleteArticleResponse)
def delete_article(
    article_id: int,
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> DeleteArticleResponse:
    usecase.delete_article(article_id)
    return DeleteArticleResponse(id=article_id, deleted=True)


@article_router.get('/{article_id}/related-articles', response_model=ArticleListResponse)
def related_articles(
    article_id: int,
    limit: int = Query(3, ge=1, le=20),
    usecase: ArticleUsecase = Depends(get_article_usecase),
) -> ArticleListResponse:
    return ArticleListResponse.from_dto(usecase.related_articles(article_id, limit))
