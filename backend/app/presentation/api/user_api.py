from fastapi import APIRouter, Depends, Query, Response, status

from app.application.schemas.user_schemas import (
    ChangePasswordInputDTO,
    UserCreateInputDTO,
    UserUpdateInputDTO,
)
from app.application.use_cases.user_usecase import UserUsecase
from app.di.auth_dependencies import User, get_current_user_from_cookie
from app.di.user_management import get_user_usecase
from app.presentation.schemas.user_schemas import (
    ChangePasswordRequest,
    CreateUserRequest,
    MessageResponse,
    UpdateUserRequest,
    UserListResponse,
    UserResponse,
)

router = APIRouter(prefix='/users', tags=['ユーザー管理'])


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: CreateUserRequest,
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> UserResponse:
    """ユーザー作成エンドポイント"""
    input_dto = UserCreateInputDTO(
        login_id=request.login_id,
        password=request.password,
        email=request.email,
        name=request.name,
    )
    output_dto = usecase.create(input_dto)
    return UserResponse.from_dto(output_dto)


@router.get('', response_model=UserListResponse, status_code=status.HTTP_200_OK)
def get_users(
    page: int = Query(1, ge=1, description='ページ番号'),
    page_size: int = Query(20, ge=1, le=100, description='1ページあたりの件数'),
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> UserListResponse:
    """ユーザー一覧取得エンドポイント"""
    output_dto = usecase.get_list(page, page_size)
    return UserListResponse.from_dto(output_dto)


@router.get('/me', response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_me(
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> UserResponse:
    """ログイン中ユーザーの情報取得エンドポイント"""
    output_dto = usecase.get(current_user.id)
    return UserResponse.from_dto(output_dto)


@router.put(
    '/me/password', response_model=MessageResponse, status_code=status.HTTP_200_OK
)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> MessageResponse:
    """パスワード変更エンドポイント（自分自身のみ）"""
    input_dto = ChangePasswordInputDTO(
        current_password=request.current_password,
        new_password=request.new_password,
    )
    usecase.change_password(current_user.id, input_dto)
    return MessageResponse(message='パスワードを変更しました')


@router.get('/{user_id}', response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> UserResponse:
    """ユーザー詳細取得エンドポイント"""
    output_dto = usecase.get(user_id)
    return UserResponse.from_dto(output_dto)


@router.put('/{user_id}', response_model=UserResponse, status_code=status.HTTP_200_OK)
def update_user(
    user_id: int,
    request: UpdateUserRequest,
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> UserResponse:
    """ユーザー更新エンドポイント"""
    input_dto = UserUpdateInputDTO(email=request.email, name=request.name)
    output_dto = usecase.update(user_id, input_dto)
    return UserResponse.from_dto(output_dto)


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user_from_cookie),
    usecase: UserUsecase = Depends(get_user_usecase),
) -> Response:
    """ユーザー削除エンドポイント"""
    usecase.delete(user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
