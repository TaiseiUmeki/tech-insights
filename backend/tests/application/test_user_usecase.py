"""UserUsecaseのテスト"""

import pytest

from app.application.schemas.user_schemas import (
    ChangePasswordInputDTO,
    UserCreateInputDTO,
    UserOutputDTO,
    UserUpdateInputDTO,
)
from app.application.use_cases.user_usecase import UserUsecase
from app.domain.entities.user import User
from app.domain.exceptions.business_exceptions import (
    AuthenticationError,
    ResourceConflictError,
    ResourceNotFoundError,
    BusinessValidationError,
)


@pytest.fixture
def user_usecase(mock_user_repository, mock_security_service):
    """UserUsecaseのインスタンスを作成"""
    return UserUsecase(
        user_repository=mock_user_repository,
        security_service=mock_security_service,
    )


@pytest.fixture
def sample_user():
    """テスト用ユーザーエンティティ"""
    return User(
        id=1,
        login_id='testuser',
        password='hashed_password',
        email='test@example.com',
        name='Test User',
    )


class TestCreate:
    """ユーザー作成のテスト"""

    def test_success(self, user_usecase, mock_user_repository, mock_security_service):
        """正常にユーザーが作成される"""
        mock_user_repository.get_by_login_id.return_value = None
        mock_security_service.hash_password.return_value = 'hashed_pw'
        mock_user_repository.create.return_value = User(
            id=1,
            login_id='newuser',
            password='hashed_pw',
            email='new@example.com',
            name='New User',
        )

        input_dto = UserCreateInputDTO(
            login_id='newuser',
            password='password123',
            email='new@example.com',
            name='New User',
        )
        result = user_usecase.create(input_dto)

        assert isinstance(result, UserOutputDTO)
        assert result.id == 1
        assert result.login_id == 'newuser'
        mock_security_service.hash_password.assert_called_once_with('password123')
        mock_user_repository.create.assert_called_once()

    def test_duplicate_login_id(self, user_usecase, mock_user_repository, sample_user):
        """login_idが重複している場合エラー"""
        mock_user_repository.get_by_login_id.return_value = sample_user

        input_dto = UserCreateInputDTO(
            login_id='testuser', password='password123'
        )

        with pytest.raises(ResourceConflictError):
            user_usecase.create(input_dto)

    def test_short_password(self, user_usecase):
        """パスワードが8文字未満の場合エラー"""
        input_dto = UserCreateInputDTO(
            login_id='newuser', password='short'
        )

        with pytest.raises(BusinessValidationError):
            user_usecase.create(input_dto)


class TestGet:
    """ユーザー取得のテスト"""

    def test_success(self, user_usecase, mock_user_repository, sample_user):
        """正常にユーザーが取得される"""
        mock_user_repository.get_by_id.return_value = sample_user

        result = user_usecase.get(1)

        assert isinstance(result, UserOutputDTO)
        assert result.id == 1
        assert result.login_id == 'testuser'

    def test_not_found(self, user_usecase, mock_user_repository):
        """存在しないユーザーの場合エラー"""
        mock_user_repository.get_by_id.return_value = None

        with pytest.raises(ResourceNotFoundError):
            user_usecase.get(999)


class TestGetList:
    """ユーザー一覧取得のテスト"""

    def test_success(self, user_usecase, mock_user_repository, sample_user):
        """正常にユーザー一覧が取得される"""
        mock_user_repository.get_all.return_value = [sample_user]
        mock_user_repository.count.return_value = 1

        result = user_usecase.get_list(page=1, page_size=20)

        assert len(result.users) == 1
        assert result.current_page == 1
        assert result.page_size == 20
        assert result.total_items == 1
        assert result.total_pages == 1

    def test_empty(self, user_usecase, mock_user_repository):
        """ユーザーが0件の場合"""
        mock_user_repository.get_all.return_value = []
        mock_user_repository.count.return_value = 0

        result = user_usecase.get_list(page=1, page_size=20)

        assert len(result.users) == 0
        assert result.total_items == 0
        assert result.total_pages == 0


class TestUpdate:
    """ユーザー更新のテスト"""

    def test_success(self, user_usecase, mock_user_repository, sample_user):
        """正常にユーザーが更新される"""
        mock_user_repository.get_by_id.return_value = sample_user
        updated_user = sample_user.model_copy(update={'name': 'Updated Name'})
        mock_user_repository.update.return_value = updated_user

        input_dto = UserUpdateInputDTO(name='Updated Name')
        result = user_usecase.update(1, input_dto)

        assert result.name == 'Updated Name'
        mock_user_repository.update.assert_called_once()

    def test_not_found(self, user_usecase, mock_user_repository):
        """存在しないユーザーの場合エラー"""
        mock_user_repository.get_by_id.return_value = None

        input_dto = UserUpdateInputDTO(name='Updated')

        with pytest.raises(ResourceNotFoundError):
            user_usecase.update(999, input_dto)


class TestDelete:
    """ユーザー削除のテスト"""

    def test_success(self, user_usecase, mock_user_repository, sample_user):
        """正常にユーザーが削除される"""
        mock_user_repository.get_by_id.return_value = sample_user
        mock_user_repository.delete.return_value = True

        user_usecase.delete(1)

        mock_user_repository.delete.assert_called_once_with(1)

    def test_not_found(self, user_usecase, mock_user_repository):
        """存在しないユーザーの場合エラー"""
        mock_user_repository.get_by_id.return_value = None

        with pytest.raises(ResourceNotFoundError):
            user_usecase.delete(999)


class TestChangePassword:
    """パスワード変更のテスト"""

    def test_success(
        self, user_usecase, mock_user_repository, mock_security_service, sample_user
    ):
        """正常にパスワードが変更される"""
        mock_user_repository.get_by_id.return_value = sample_user
        mock_security_service.verify_password.return_value = True
        mock_security_service.hash_password.return_value = 'new_hashed_pw'
        mock_user_repository.update.return_value = sample_user

        input_dto = ChangePasswordInputDTO(
            current_password='old_password', new_password='new_password123'
        )
        user_usecase.change_password(1, input_dto)

        mock_security_service.verify_password.assert_called_once_with(
            'old_password', 'hashed_password'
        )
        mock_security_service.hash_password.assert_called_once_with('new_password123')
        mock_user_repository.update.assert_called_once()

    def test_wrong_current_password(
        self, user_usecase, mock_user_repository, mock_security_service, sample_user
    ):
        """現在のパスワードが不一致の場合エラー"""
        mock_user_repository.get_by_id.return_value = sample_user
        mock_security_service.verify_password.return_value = False

        input_dto = ChangePasswordInputDTO(
            current_password='wrong_password', new_password='new_password123'
        )

        with pytest.raises(AuthenticationError):
            user_usecase.change_password(1, input_dto)

    def test_short_new_password(
        self, user_usecase, mock_user_repository, mock_security_service, sample_user
    ):
        """新しいパスワードが8文字未満の場合エラー"""
        mock_user_repository.get_by_id.return_value = sample_user
        mock_security_service.verify_password.return_value = True

        input_dto = ChangePasswordInputDTO(
            current_password='old_password', new_password='short'
        )

        with pytest.raises(BusinessValidationError):
            user_usecase.change_password(1, input_dto)

    def test_user_not_found(self, user_usecase, mock_user_repository):
        """存在しないユーザーの場合エラー"""
        mock_user_repository.get_by_id.return_value = None

        input_dto = ChangePasswordInputDTO(
            current_password='old', new_password='new_password123'
        )

        with pytest.raises(ResourceNotFoundError):
            user_usecase.change_password(999, input_dto)
