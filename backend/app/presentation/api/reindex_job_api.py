from fastapi import APIRouter, Depends, status

from app.application.use_cases.reindex_usecase import ReindexUsecase
from app.di.article_management import get_reindex_usecase
from app.presentation.schemas.article_schemas import (
    ReindexJobRequest,
    ReindexJobResponse,
)

reindex_router = APIRouter(prefix='/api/reindex-jobs', tags=['検索管理'])


@reindex_router.post(
    '', response_model=ReindexJobResponse, status_code=status.HTTP_201_CREATED
)
def create_reindex_job(
    request: ReindexJobRequest,
    usecase: ReindexUsecase = Depends(get_reindex_usecase),
) -> ReindexJobResponse:
    return ReindexJobResponse.from_dto(usecase.reindex(request.article_id))
