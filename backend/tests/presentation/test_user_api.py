"""ユーザー管理APIのテスト"""

from unittest.mock import MagicMock

from fastapi import status
from fastapi.testclient import TestClient

from app.application.schemas.user_schemas import UserListOutputDTO, UserOutputDTO
from app.di.user_management import get_user_usecase
from app.domain.exceptions.business_exceptions import (
    AuthenticationError,
    ResourceConflictError,
    ResourceNotFoundError,
    BusinessValidationError,
)
from app.main import app


def _create_client_with_mock_usecase(mock_usecase: MagicMock) -> TestClient:
    """モックUsecaseを注入したTestClientを作成"""
    app.dependency_overrides[get_user_usecase] = lambda: mock_usecase
    return TestClient(app)


def _sample_user_output(user_id: int = 1, login_id: str = 'testuser') -> UserOutputDTO:
    return UserOutputDTO(
        id=user_id,
        login_id=login_id,
        email='test@example.com',
        name='Test User',
    )


class TestCreateUser:
    """POST /users のテスト"""

    def test_success(self):
        """正常にユーザーが作成される"""
        mock_usecase = MagicMock()
        mock_usecase.create.return_value = _sample_user_output()
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.post(
            '/users',
            json={
                'login_id': 'newuser',
                'password': 'password123',
                'email': 'new@example.com',
                'name': 'New User',
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['login_id'] == 'testuser'
        assert 'password' not in data
        mock_usecase.create.assert_called_once()

    def test_duplicate_login_id(self):
        """login_idが重複している場合409"""
        mock_usecase = MagicMock()
        mock_usecase.create.side_effect = ResourceConflictError('重複')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.post(
            '/users',
            json={'login_id': 'duplicate', 'password': 'password123'},
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_short_password(self):
        """パスワードが短すぎる場合422"""
        mock_usecase = MagicMock()
        mock_usecase.create.side_effect = BusinessValidationError('8文字以上')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.post(
            '/users',
            json={'login_id': 'newuser', 'password': 'short'},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_missing_login_id(self, test_client: TestClient):
        """login_idが欠けている場合バリデーションエラー"""
        response = test_client.post(
            '/users',
            json={'password': 'password123'},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_missing_password(self, test_client: TestClient):
        """passwordが欠けている場合バリデーションエラー"""
        response = test_client.post(
            '/users',
            json={'login_id': 'nopw_user'},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestGetUsers:
    """GET /users のテスト"""

    def test_success(self):
        """正常にユーザー一覧が取得される"""
        mock_usecase = MagicMock()
        mock_usecase.get_list.return_value = UserListOutputDTO(
            users=[_sample_user_output()],
            current_page=1,
            page_size=20,
            total_items=1,
            total_pages=1,
        )
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.get('/users')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data['users']) == 1
        assert data['current_page'] == 1
        assert data['total_items'] == 1

    def test_pagination_params(self):
        """ページネーションパラメータが渡される"""
        mock_usecase = MagicMock()
        mock_usecase.get_list.return_value = UserListOutputDTO(
            users=[], current_page=2, page_size=5, total_items=0, total_pages=0
        )
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.get('/users?page=2&page_size=5')

        assert response.status_code == status.HTTP_200_OK
        mock_usecase.get_list.assert_called_once_with(2, 5)


class TestGetUser:
    """GET /users/{user_id} のテスト"""

    def test_success(self):
        """正常にユーザーが取得される"""
        mock_usecase = MagicMock()
        mock_usecase.get.return_value = _sample_user_output(user_id=42)
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.get('/users/42')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['id'] == 42
        assert 'password' not in data

    def test_not_found(self):
        """存在しないユーザーの場合404"""
        mock_usecase = MagicMock()
        mock_usecase.get.side_effect = ResourceNotFoundError('見つかりません')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.get('/users/99999')

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUpdateUser:
    """PUT /users/{user_id} のテスト"""

    def test_success(self):
        """正常にユーザーが更新される"""
        mock_usecase = MagicMock()
        mock_usecase.update.return_value = _sample_user_output()
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.put(
            '/users/1',
            json={'name': 'Updated', 'email': 'updated@example.com'},
        )

        assert response.status_code == status.HTTP_200_OK
        mock_usecase.update.assert_called_once()

    def test_not_found(self):
        """存在しないユーザーの場合404"""
        mock_usecase = MagicMock()
        mock_usecase.update.side_effect = ResourceNotFoundError('見つかりません')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.put('/users/99999', json={'name': 'Updated'})

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDeleteUser:
    """DELETE /users/{user_id} のテスト"""

    def test_success(self):
        """正常にユーザーが削除される"""
        mock_usecase = MagicMock()
        mock_usecase.delete.return_value = None
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.delete('/users/1')

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_not_found(self):
        """存在しないユーザーの場合404"""
        mock_usecase = MagicMock()
        mock_usecase.delete.side_effect = ResourceNotFoundError('見つかりません')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.delete('/users/99999')

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestChangePassword:
    """PUT /users/me/password のテスト"""

    def test_success(self):
        """正常にパスワードが変更される"""
        mock_usecase = MagicMock()
        mock_usecase.change_password.return_value = None
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.put(
            '/users/me/password',
            json={'current_password': 'oldpass123', 'new_password': 'newpass123'},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['message'] == 'パスワードを変更しました'

    def test_wrong_current_password(self):
        """現在のパスワードが不一致の場合401"""
        mock_usecase = MagicMock()
        mock_usecase.change_password.side_effect = AuthenticationError('不一致')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.put(
            '/users/me/password',
            json={'current_password': 'wrong', 'new_password': 'newpass123'},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_short_new_password(self):
        """新しいパスワードが短すぎる場合422"""
        mock_usecase = MagicMock()
        mock_usecase.change_password.side_effect = BusinessValidationError('8文字以上')
        client = _create_client_with_mock_usecase(mock_usecase)

        response = client.put(
            '/users/me/password',
            json={'current_password': 'oldpass123', 'new_password': 'short'},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_missing_fields(self, test_client: TestClient):
        """必須フィールドが欠けている場合バリデーションエラー"""
        response = test_client.put(
            '/users/me/password',
            json={'new_password': 'newpass123'},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
