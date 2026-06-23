from __future__ import annotations

from pydantic import BaseModel, Field

from app.application.schemas.user_schemas import UserListOutputDTO, UserOutputDTO


class CreateUserRequest(BaseModel):
    """ユーザー作成リクエスト"""

    login_id: str = Field(..., description='ログインID')
    password: str = Field(..., description='パスワード')
    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')


class UpdateUserRequest(BaseModel):
    """ユーザー更新リクエスト"""

    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')


class ChangePasswordRequest(BaseModel):
    """パスワード変更リクエスト"""

    current_password: str = Field(..., description='現在のパスワード')
    new_password: str = Field(..., description='新しいパスワード')


class UserResponse(BaseModel):
    """ユーザーレスポンス"""

    id: int = Field(..., description='ユーザーID')
    login_id: str = Field(..., description='ログインID')
    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')

    @classmethod
    def from_dto(cls, dto: UserOutputDTO) -> UserResponse:
        return cls(
            id=dto.id,
            login_id=dto.login_id,
            email=dto.email,
            name=dto.name,
        )


class UserListResponse(BaseModel):
    """ユーザー一覧レスポンス"""

    users: list[UserResponse] = Field(..., description='ユーザーリスト')
    current_page: int = Field(..., description='現在のページ')
    page_size: int = Field(..., description='1ページあたりの件数')
    total_items: int = Field(..., description='総件数')
    total_pages: int = Field(..., description='総ページ数')

    @classmethod
    def from_dto(cls, dto: UserListOutputDTO) -> UserListResponse:
        return cls(
            users=[UserResponse.from_dto(u) for u in dto.users],
            current_page=dto.current_page,
            page_size=dto.page_size,
            total_items=dto.total_items,
            total_pages=dto.total_pages,
        )


class MessageResponse(BaseModel):
    """メッセージレスポンス"""

    message: str = Field(..., description='メッセージ')
