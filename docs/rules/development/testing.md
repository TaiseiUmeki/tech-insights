---
description: Testing guide for all layers - frontend, backend, and infrastructure
---
# テストガイド

## 目次

1. [概要](#概要)
2. [フロントエンドテスト](#フロントエンドテスト)
3. [バックエンドテスト](#バックエンドテスト)
4. [インフラテスト](#インフラテスト)
5. [CI/CD テスト](#cicd-テスト)

---

## 概要

本プロジェクトでは、フロントエンド、バックエンド、インフラの各テスト環境が独立しています。

| Target | Framework | Language |
| --- | --- | --- |
| Frontend | Jest | TypeScript |
| Backend | pytest | Python |
| Infrastructure | Jest + CDK assertions | TypeScript |

---

## フロントエンドテスト

### テスト環境

| Tool | 用途 |
| --- | --- |
| **Jest** | テストフレームワーク |
| **React Testing Library** | コンポーネントテスト |
| **@testing-library/jest-dom** | DOM アサーション拡張 |

### テストの実行

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Specific file
npm test -- date.test.ts

# CI mode (GitHub Actions)
npm test -- --ci
```

### テストファイルの配置

```
frontend/src/
├── shared/
│   └── utils/
│       └── format/
│           ├── date.ts
│           └── __tests__/
│               └── date.test.ts    # Unit test
├── entities/
│   └── [domain]/
│       └── api/
│           └── __tests__/
│               └── [domain]-api.test.ts
└── features/
    └── [feature]/
        └── __tests__/
            └── use-[feature].test.tsx
```

### ユニットテストの例

```typescript
// shared/utils/format/__tests__/date.test.ts
import { formatDate } from "../date";

describe("formatDate", () => {
  it("formats date string to yy/MM/dd", () => {
    expect(formatDate("2024-03-15")).toBe("24/03/15");
  });

  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe("-");
  });

  it('returns "-" for invalid date', () => {
    expect(formatDate("invalid-date")).toBe("-");
  });
});
```

### テスト構造（AAA パターン）

```typescript
describe("Feature group name", () => {
  it("describes expected behavior", () => {
    // Arrange
    const input = "2024-03-15";

    // Act
    const result = formatDate(input);

    // Assert
    expect(result).toBe("24/03/15");
  });
});
```

### カバーすべきテストケース

- 正常系（期待される入力）
- 異常系（null、undefined、空文字列）
- 境界値（エッジケース）

---

## バックエンドテスト

### テスト環境

| Tool | 用途 |
| --- | --- |
| **pytest** | テストフレームワーク |
| **pytest-cov** | カバレッジ計測 |
| **FastAPI TestClient** | API エンドポイントテスト |
| **SQLAlchemy** | DB テスト（SQLite インメモリ） |

### テストの実行

```bash
cd backend

# Run all tests
pytest

# Verbose output
pytest -v

# With coverage
pytest --cov=app --cov-report=html

# Specific file/directory
pytest tests/presentation/
pytest tests/domain/test_user_entity.py

# Specific test class/method
pytest tests/presentation/test_auth_api.py::TestAuthAPI::test_login_success
```

### テストファイルの配置（クリーンアーキテクチャ）

```
backend/tests/
├── conftest.py                    # Common fixtures
├── domain/                        # Domain layer tests
│   ├── test_user_entity.py
│   └── test_user_repository_interface.py
├── application/                   # Application layer tests
│   └── test_auth_usecase.py
├── infrastructure/                # Infrastructure layer tests
│   ├── test_user_repository_impl.py
│   └── test_security_service_impl.py
└── presentation/                  # Presentation layer tests
    └── test_auth_api.py
```

### レイヤー別テストパターン

#### 1. ドメイン層（エンティティ）

```python
# tests/domain/test_user_entity.py
import pytest
from pydantic import ValidationError
from app.domain.entities.user import User

class TestUserEntity:
    def test_create_user_with_all_fields(self):
        """全フィールドを指定して User を作成"""
        user = User(
            id=1,
            login_id='test_user',
            password='hashed_password',
            email='test@example.com',
            name='Test User',
        )
        assert user.id == 1
        assert user.login_id == 'test_user'

    def test_create_user_without_id_raises_error(self):
        """ID なしで User を作成するとエラーが発生する"""
        with pytest.raises(ValidationError):
            User(login_id='test_user', password='hashed_password')
```

#### 2. アプリケーション層（ユースケース）

```python
# tests/application/test_auth_usecase.py
import pytest
from fastapi import HTTPException
from app.application.use_cases.auth_usecase import AuthUsecase
from app.application.schemas.auth_schemas import LoginInputDTO

class TestAuthUsecase:
    def test_login_success(self, mock_security_service):
        """ログイン成功テスト"""
        mock_security_service.create_access_token.return_value = 'test_token'
        usecase = AuthUsecase(security_service=mock_security_service)
        input_dto = LoginInputDTO(login_id='admin', password='pass')

        result = usecase.login(input_dto)

        assert result.access_token == 'test_token'
        mock_security_service.create_access_token.assert_called_once()

    def test_login_failure_wrong_credentials(self, mock_security_service):
        """ログイン失敗テスト"""
        usecase = AuthUsecase(security_service=mock_security_service)
        input_dto = LoginInputDTO(login_id='wrong', password='wrong')

        with pytest.raises(HTTPException) as exc_info:
            usecase.login(input_dto)

        assert exc_info.value.status_code == 401
```

#### 3. インフラストラクチャ層（リポジトリ実装）

```python
# tests/infrastructure/test_user_repository_impl.py
from app.infrastructure.db.repositories.user_repository_impl import UserRepositoryImpl

class TestUserRepositoryImpl:
    def test_get_by_login_id_existing_user(self, db_session):
        """ログイン ID で既存ユーザーを取得する"""
        from app.infrastructure.db.models.user_model import UserModel
        user_model = UserModel(login_id='test_user', password='hashed', ...)
        db_session.add(user_model)
        db_session.commit()

        repository = UserRepositoryImpl(session=db_session)
        user = repository.get_by_login_id('test_user')

        assert user is not None
        assert user.login_id == 'test_user'

    def test_get_by_login_id_non_existing_user(self, db_session):
        """存在しないユーザーは None を返す"""
        repository = UserRepositoryImpl(session=db_session)
        user = repository.get_by_login_id('non_existing')
        assert user is None
```

#### 4. プレゼンテーション層（API エンドポイント）

```python
# tests/presentation/test_auth_api.py
from fastapi import status
from fastapi.testclient import TestClient

class TestAuthAPI:
    def test_login_success(self, test_client: TestClient):
        """ログイン成功テスト"""
        response = test_client.post(
            '/auth/login',
            json={'login_id': 'admin', 'password': 'pass'}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'access_token' in data
        assert 'access_token' in response.cookies

    def test_login_failure_wrong_credentials(self, test_client: TestClient):
        """ログイン失敗テスト"""
        response = test_client.post(
            '/auth/login',
            json={'login_id': 'wrong', 'password': 'wrong'}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_field(self, test_client: TestClient):
        """バリデーションエラーテスト"""
        response = test_client.post(
            '/auth/login',
            json={'password': 'pass'}  # login_id missing
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
```

### ベストプラクティス

1. **各テストは独立**: `db_session` は各テスト後にロールバック
2. **モックの活用**: `MagicMock` で依存関係を分離
3. **fixture のスコープ**: `session` > `module` > `function`
4. **認証の無効化**: テスト時は `ENABLE_AUTH=false` に設定

---

## インフラテスト

### テスト環境

| Tool | 用途 |
| --- | --- |
| **Jest** | テストフレームワーク |
| **CDK assertions** | CloudFormation テンプレートの検証 |
| **aws-cdk-lib** | CDK コンストラクト |

### テストの実行

```bash
cd infra

# Run all tests
npx jest

# Watch mode
npx jest --watch

# Specific file
npx jest foundation-stack.test.ts

# Update snapshots
npx jest --updateSnapshot
```

### テストファイルの配置（4層アーキテクチャ）

```
infra/test/
├── test-config.ts                     # Test config
├── construct/                         # Layer 1: Construct tests
│   ├── compute/
│   ├── networking/
│   └── security/
├── resource/                          # Layer 2: Resource tests
│   ├── network-resource.test.ts
│   └── ...
└── stack/                             # Layer 3: Stack tests
    ├── foundation-stack.test.ts
    └── ...
```

### CDK assertions API

| Method | 用途 |
|--------|------|
| `template.resourceCountIs()` | リソース数の検証 |
| `template.hasResourceProperties()` | リソースプロパティの検証 |
| `template.hasResource()` | リソースの存在確認 |
| `template.findOutputs()` | Output の検索 |
| `template.hasOutput()` | Output の存在確認 |

### ベストプラクティス

1. **テスト設定の分離**: `test-config.ts` に固定値を使用
2. **レイヤーごとのテスト**: Construct -> Resource -> Stack
3. **リソース数の検証**: `resourceCountIs()` で期待するリソースを確認
4. **プロパティの検証**: セキュリティ設定などの重要なプロパティを検証
5. **スナップショットテスト**: 意図しない変更を検出

---

## CI/CD テスト

### Frontend CI

```yaml
# .github/workflows/frontend-ci.yml
- run: npm ci
- run: npm run build
- run: npm test -- --ci
```

### Backend CI

```yaml
# .github/workflows/backend-ci.yml
- run: pip install -r requirements.txt
- run: pytest --cov=app --cov-report=xml
```

### Infrastructure CI

```yaml
# .github/workflows/infra-ci.yml
- run: npm ci
- run: npx jest
```

---

## カバレッジ目標

| 対象 | 目標 |
| --- | --- |
| Frontend Shared | 80%+ |
| Backend Domain | 90%+ |
| Backend Application | 80%+ |
| Backend Infrastructure | 70%+ |
| Backend Presentation | 80%+ |
| Infrastructure Stack | 80%+ |
| Infrastructure Resource | 70%+ |

---

## 参考リンク

### Frontend

- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Backend

- [pytest](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

### Infrastructure

- [CDK Testing](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
- [CDK assertions](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.assertions-readme.html)
