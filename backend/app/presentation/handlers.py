"""例外ハンドラの定義"""

from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.domain.exceptions.business_exceptions import (
    AuthenticationError,
    AuthorizationError,
    BusinessLogicError,
    BusinessValidationError,
    ResourceConflictError,
    ResourceNotFoundError,
)


async def authentication_error_handler(
    request: Request, exc: AuthenticationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={'detail': str(exc)},
    )


async def authorization_error_handler(
    request: Request, exc: AuthorizationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={'detail': str(exc)},
    )


async def resource_not_found_error_handler(
    request: Request, exc: ResourceNotFoundError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={'detail': str(exc)},
    )


async def resource_conflict_error_handler(
    request: Request, exc: ResourceConflictError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={'detail': str(exc)},
    )


async def business_validation_error_handler(
    request: Request, exc: BusinessValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={'detail': str(exc)},
    )


async def business_logic_error_handler(
    request: Request, exc: BusinessLogicError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={'detail': str(exc)},
    )


def register_exception_handlers(app) -> None:
    """アプリケーションに例外ハンドラを登録"""
    app.add_exception_handler(AuthenticationError, authentication_error_handler)
    app.add_exception_handler(AuthorizationError, authorization_error_handler)
    app.add_exception_handler(ResourceNotFoundError, resource_not_found_error_handler)
    app.add_exception_handler(ResourceConflictError, resource_conflict_error_handler)
    app.add_exception_handler(BusinessValidationError, business_validation_error_handler)
    app.add_exception_handler(BusinessLogicError, business_logic_error_handler)
