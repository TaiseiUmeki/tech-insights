from app.application.interfaces.security_service import ISecurityService
from app.application.schemas.user_schemas import (
    ChangePasswordInputDTO,
    UserCreateInputDTO,
    UserListOutputDTO,
    UserOutputDTO,
    UserUpdateInputDTO,
)
from app.domain.exceptions.business_exceptions import (
    AuthenticationError,
    ResourceConflictError,
    ResourceNotFoundError,
)
from app.domain.repositories.user_repository import IUserRepository
from app.domain.value_objects.password import Password


class UserUsecase:
    """ユーザー管理ユースケース"""

    def __init__(
        self,
        user_repository: IUserRepository,
        security_service: ISecurityService,
    ):
        self._user_repository = user_repository
        self._security_service = security_service

    def create(self, input_dto: UserCreateInputDTO) -> UserOutputDTO:
        """ユーザーを作成"""
        Password(input_dto.password)

        existing = self._user_repository.get_by_login_id(input_dto.login_id)
        if existing:
            raise ResourceConflictError(
                f'ログインID "{input_dto.login_id}" は既に使用されています'
            )

        hashed_password = self._security_service.hash_password(input_dto.password)
        user = input_dto.to_entity(hashed_password)
        created = self._user_repository.create(user)
        return UserOutputDTO.from_entity(created)

    def get(self, user_id: int) -> UserOutputDTO:
        """ユーザーを取得"""
        user = self._user_repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f'ユーザーID {user_id} が見つかりません')
        return UserOutputDTO.from_entity(user)

    def get_list(self, page: int, page_size: int) -> UserListOutputDTO:
        """ユーザー一覧を取得"""
        users = self._user_repository.get_all(page, page_size)
        total = self._user_repository.count()
        return UserListOutputDTO.from_entities(users, page, page_size, total)

    def update(self, user_id: int, input_dto: UserUpdateInputDTO) -> UserOutputDTO:
        """ユーザーを更新"""
        user = self._user_repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f'ユーザーID {user_id} が見つかりません')

        update_data = input_dto.model_dump(exclude_unset=True)
        updated_user = user.model_copy(update=update_data)
        saved = self._user_repository.update(updated_user)
        return UserOutputDTO.from_entity(saved)

    def delete(self, user_id: int) -> None:
        """ユーザーを削除"""
        user = self._user_repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f'ユーザーID {user_id} が見つかりません')
        self._user_repository.delete(user_id)

    def change_password(self, user_id: int, input_dto: ChangePasswordInputDTO) -> None:
        """パスワードを変更"""
        user = self._user_repository.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f'ユーザーID {user_id} が見つかりません')

        if not self._security_service.verify_password(
            input_dto.current_password, user.password
        ):
            raise AuthenticationError('現在のパスワードが正しくありません')

        Password(input_dto.new_password)
        hashed_password = self._security_service.hash_password(input_dto.new_password)
        updated_user = user.model_copy(update={'password': hashed_password})
        self._user_repository.update(updated_user)
