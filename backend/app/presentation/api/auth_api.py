from fastapi import APIRouter, Depends, Response, status

from app.application.schemas.auth_schemas import LoginInputDTO
from app.application.use_cases.auth_usecase import AuthUsecase
from app.di.auth import get_auth_usecase
from app.di.auth_dependencies import User, get_current_user_from_cookie
from app.presentation.schemas.auth_schemas import (
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    StatusResponse,
)

router = APIRouter(prefix='/auth', tags=['認証'])


@router.post('/login', response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(
    request: LoginRequest,
    response: Response,
    auth_usecase: AuthUsecase = Depends(get_auth_usecase),
) -> LoginResponse:
    input_dto = LoginInputDTO(login_id=request.login_id, password=request.password)

    output_dto = auth_usecase.login(input_dto)

    # Cookieにアクセストークンを設定
    response.set_cookie(
        key='access_token',
        value=output_dto.access_token,
        httponly=True,  # JavaScriptからのアクセスを防ぐ
        secure=True,  # HTTPS接続でのみ送信
        samesite='lax',  # CSRF攻撃対策
        max_age=7 * 24 * 60 * 60,  # 7日間
    )

    return LoginResponse.from_dto(output_dto)


@router.post('/logout', response_model=LogoutResponse, status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    current_user: User = Depends(get_current_user_from_cookie),
    auth_usecase: AuthUsecase = Depends(get_auth_usecase),
) -> LogoutResponse:
    """ログアウトエンドポイント"""
    output_dto = auth_usecase.logout()

    # Cookieを削除
    response.delete_cookie(key='access_token')

    return LogoutResponse.from_dto(output_dto)


@router.get('/status', response_model=StatusResponse, status_code=status.HTTP_200_OK)
def get_status(
    current_user: User = Depends(get_current_user_from_cookie),
    auth_usecase: AuthUsecase = Depends(get_auth_usecase),
) -> StatusResponse:
    """認証状態取得エンドポイント"""
    output_dto = auth_usecase.get_auth_status(user_id=current_user.id)

    return StatusResponse.from_dto(output_dto)
