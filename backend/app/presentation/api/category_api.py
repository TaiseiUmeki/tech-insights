from fastapi import APIRouter, Depends, Query

from app.application.use_cases.category_usecase import CategoryUsecase
from app.di.article_management import get_category_usecase
from app.presentation.schemas.article_schemas import (
    CategoryListResponse,
    CategoryResponse,
)

category_router = APIRouter(prefix='/api/categories', tags=['カテゴリ'])


@category_router.get('', response_model=CategoryListResponse)
def list_categories(
    q: str | None = Query(None),
    usecase: CategoryUsecase = Depends(get_category_usecase),
) -> CategoryListResponse:
    return CategoryListResponse(
        items=[CategoryResponse.from_dto(item) for item in usecase.list_categories(q)]
    )
