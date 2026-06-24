from fastapi import APIRouter, Depends, Query

from app.application.use_cases.author_usecase import AuthorUsecase
from app.di.article_management import get_author_usecase
from app.presentation.schemas.article_schemas import (
    AuthorListResponse,
    AuthorResponse,
)

author_router = APIRouter(prefix='/api/authors', tags=['著者'])


@author_router.get('', response_model=AuthorListResponse)
def list_authors(
    q: str | None = Query(None),
    usecase: AuthorUsecase = Depends(get_author_usecase),
) -> AuthorListResponse:
    return AuthorListResponse(
        items=[AuthorResponse.from_dto(item) for item in usecase.list_authors(q)]
    )
