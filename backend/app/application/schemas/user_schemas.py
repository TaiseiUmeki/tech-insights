from __future__ import annotations

from pydantic import BaseModel, Field

from app.domain.entities.user import User


class UserCreateInputDTO(BaseModel):
    """ユーザー作成入力DTO"""

    login_id: str = Field(..., description='ログインID')
    password: str = Field(..., description='パスワード')
    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')

    def to_entity(self, hashed_password: str) -> User:
        return User(
            id=0,
            login_id=self.login_id,
            password=hashed_password,
            email=self.email,
            name=self.name,
        )


class UserUpdateInputDTO(BaseModel):
    """ユーザー更新入力DTO"""

    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')


class ChangePasswordInputDTO(BaseModel):
    """パスワード変更入力DTO"""

    current_password: str = Field(..., description='現在のパスワード')
    new_password: str = Field(..., description='新しいパスワード')


class UserOutputDTO(BaseModel):
    """ユーザー出力DTO"""

    id: int = Field(..., description='ユーザーID')
    login_id: str = Field(..., description='ログインID')
    email: str | None = Field(None, description='メールアドレス')
    name: str | None = Field(None, description='ユーザー名')

    @classmethod
    def from_entity(cls, entity: User) -> UserOutputDTO:
        return cls(
            id=entity.id,
            login_id=entity.login_id,
            email=entity.email,
            name=entity.name,
        )


class UserListOutputDTO(BaseModel):
    """ユーザー一覧出力DTO"""

    users: list[UserOutputDTO] = Field(..., description='ユーザーリスト')
    current_page: int = Field(..., description='現在のページ')
    page_size: int = Field(..., description='1ページあたりの件数')
    total_items: int = Field(..., description='総件数')
    total_pages: int = Field(..., description='総ページ数')

    @classmethod
    def from_entities(
        cls, entities: list[User], page: int, page_size: int, total: int
    ) -> UserListOutputDTO:
        return cls(
            users=[UserOutputDTO.from_entity(e) for e in entities],
            current_page=page,
            page_size=page_size,
            total_items=total,
            total_pages=(total + page_size - 1) // page_size,
        )
