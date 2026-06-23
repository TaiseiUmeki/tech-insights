from __future__ import annotations

from pydantic import BaseModel, Field

from app.application.schemas.auth_schemas import (
    LoginOutputDTO,
    LogoutOutputDTO,
    StatusOutputDTO,
)


class LoginRequest(BaseModel):
    """ログインリクエスト"""

    login_id: str = Field(..., description='ログインID')
    password: str = Field(..., description='パスワード')


class LoginResponse(BaseModel):
    """ログインレスポンス"""

    message: str = Field(..., description='メッセージ')
    access_token: str = Field(..., description='アクセストークン')
    user_id: int = Field(..., description='ユーザーID')

    @classmethod
    def from_dto(cls, dto: LoginOutputDTO) -> LoginResponse:
        return cls(
            message='ログイン成功',
            access_token=dto.access_token,
            user_id=dto.user_id,
        )


class LogoutResponse(BaseModel):
    """ログアウトレスポンス"""

    message: str = Field(..., description='メッセージ')

    @classmethod
    def from_dto(cls, dto: LogoutOutputDTO) -> LogoutResponse:
        return cls(message=dto.message)


class StatusResponse(BaseModel):
    """認証状態レスポンス"""

    is_authenticated: bool = Field(..., description='認証済みかどうか')
    user_id: int = Field(..., description='ユーザーID')

    @classmethod
    def from_dto(cls, dto: StatusOutputDTO) -> StatusResponse:
        return cls(
            is_authenticated=dto.is_authenticated,
            user_id=dto.user_id,
        )
