from pydantic import BaseModel, Field


class LoginInputDTO(BaseModel):
    """ログイン入力DTO"""

    login_id: str = Field(..., description='ログインID')
    password: str = Field(..., description='パスワード')


class LoginOutputDTO(BaseModel):
    """ログイン出力DTO"""

    access_token: str = Field(..., description='アクセストークン')
    user_id: int = Field(..., description='ユーザーID')


class LogoutOutputDTO(BaseModel):
    """ログアウト出力DTO"""

    message: str = Field(..., description='メッセージ')


class StatusOutputDTO(BaseModel):
    """認証状態出力DTO"""

    is_authenticated: bool = Field(..., description='認証済みかどうか')
    user_id: int = Field(..., description='ユーザーID')

    @classmethod
    def from_user_id(cls, user_id: int) -> 'StatusOutputDTO':
        return cls(is_authenticated=True, user_id=user_id)
