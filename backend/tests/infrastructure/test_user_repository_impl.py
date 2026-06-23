"""UserRepositoryImplのテスト"""


from app.domain.entities.user import User
from app.infrastructure.db.repositories.user_repository_impl import UserRepositoryImpl


class TestUserRepositoryImpl:
    """UserRepositoryImplのテストクラス"""

    def test_get_by_login_id_existing_user(self, db_session):
        """既存ユーザーをログインIDで取得"""
        # テストデータの作成
        from app.infrastructure.db.models.user_model import UserModel

        user_model = UserModel(
            login_id='test_user',
            password='hashed_password',
            email='test@example.com',
            name='Test User',
        )
        db_session.add(user_model)
        db_session.flush()

        # リポジトリのインスタンス作成
        repository = UserRepositoryImpl(session=db_session)

        # テスト実行
        user = repository.get_by_login_id('test_user')

        # 検証
        assert user is not None
        assert user.login_id == 'test_user'
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'

    def test_get_by_login_id_non_existing_user(self, db_session):
        """存在しないユーザーをログインIDで取得"""
        repository = UserRepositoryImpl(session=db_session)
        user = repository.get_by_login_id('non_existing_user')
        assert user is None

    def test_get_by_id_existing_user(self, db_session):
        """既存ユーザーをIDで取得"""
        from app.infrastructure.db.models.user_model import UserModel

        user_model = UserModel(
            login_id='test_user_by_id',
            password='hashed_password',
            email='test_id@example.com',
            name='Test User By ID',
        )
        db_session.add(user_model)
        db_session.flush()

        repository = UserRepositoryImpl(session=db_session)
        user = repository.get_by_id(user_model.id)

        assert user is not None
        assert user.id == user_model.id

    def test_create_user(self, db_session):
        """ユーザーを作成"""
        repository = UserRepositoryImpl(session=db_session)

        new_user = User(
            id=0,  # IDは自動採番
            login_id='new_user',
            password='hashed_password',
            email='new@example.com',
            name='New User',
        )

        created_user = repository.create(new_user)

        assert created_user.id > 0
        assert created_user.login_id == 'new_user'

    def test_update_user(self, db_session):
        """ユーザーを更新"""
        from app.infrastructure.db.models.user_model import UserModel

        user_model = UserModel(
            login_id='test_user_update',
            password='hashed_password',
            email='test_update@example.com',
            name='Test User Update',
        )
        db_session.add(user_model)
        db_session.flush()

        repository = UserRepositoryImpl(session=db_session)

        # 更新するユーザー
        updated_user = User(
            id=user_model.id,
            login_id='test_user_update',
            password='new_hashed_password',
            email='updated@example.com',
            name='Updated User',
        )

        result = repository.update(updated_user)

        assert result.email == 'updated@example.com'
        assert result.name == 'Updated User'

    def test_get_all_with_pagination(self, db_session):
        """ページネーションでユーザー一覧を取得"""
        from app.infrastructure.db.models.user_model import UserModel

        for i in range(5):
            db_session.add(
                UserModel(
                    login_id=f'user_{i}',
                    password='hashed',
                    email=f'user{i}@example.com',
                    name=f'User {i}',
                )
            )
        db_session.flush()

        repository = UserRepositoryImpl(session=db_session)

        # 1ページ目（2件ずつ）
        page1 = repository.get_all(page=1, page_size=2)
        assert len(page1) == 2

        # 2ページ目
        page2 = repository.get_all(page=2, page_size=2)
        assert len(page2) == 2

        # 3ページ目（残り1件）
        page3 = repository.get_all(page=3, page_size=2)
        assert len(page3) == 1

        # ページ外
        page4 = repository.get_all(page=4, page_size=2)
        assert len(page4) == 0

    def test_get_all_empty(self, db_session):
        """ユーザーが0件の場合"""
        repository = UserRepositoryImpl(session=db_session)
        result = repository.get_all(page=1, page_size=20)
        assert result == []

    def test_count(self, db_session):
        """ユーザーの総数を取得"""
        from app.infrastructure.db.models.user_model import UserModel

        for i in range(3):
            db_session.add(
                UserModel(
                    login_id=f'count_user_{i}',
                    password='hashed',
                )
            )
        db_session.flush()

        repository = UserRepositoryImpl(session=db_session)
        assert repository.count() == 3

    def test_count_empty(self, db_session):
        """ユーザーが0件の場合のカウント"""
        repository = UserRepositoryImpl(session=db_session)
        assert repository.count() == 0

    def test_delete_user(self, db_session):
        """ユーザーを削除"""
        from app.infrastructure.db.models.user_model import UserModel

        user_model = UserModel(
            login_id='test_user_delete',
            password='hashed_password',
            email='test_delete@example.com',
            name='Test User Delete',
        )
        db_session.add(user_model)
        db_session.flush()
        user_id = user_model.id

        repository = UserRepositoryImpl(session=db_session)
        result = repository.delete(user_id)

        assert result is True

        # 削除されたことを確認
        user = repository.get_by_id(user_id)
        assert user is None
