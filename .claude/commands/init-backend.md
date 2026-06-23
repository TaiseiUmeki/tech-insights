---
description: バックエンド開発時の前提知識とコーディング規約を読み込む
---

# バックエンド開発ガイドライン

このプロンプトを読んだ後、以下のドキュメントを確認してください。

@docs/rules/architecture/BACKEND.md
@backend/documents/api/api.md

---

## 1. 開発環境の前提条件

### Docker環境

このプロジェクトは**Docker環境がすでに立ち上がっている**ことを前提としています。

**前提条件**:

- ✅ **Dockerコンテナがすでに起動済み**（`docker compose up -d`実行済み）
- ✅ **すべてのコマンドはdocker-compose経由で実行**
- ✅ **ローカルのPython環境では実行しない**

**注意**: コンテナが起動していない場合は、先に`docker compose up -d`でコンテナを起動してください。

### コマンド実行例

```bash
# ❌ ローカルで直接実行（非推奨）
python backend/scripts/some_script.py

# ✅ docker-compose経由で実行（推奨）
docker compose exec backend python backend/scripts/some_script.py

# ✅ Makefileのコマンドを使用（さらに推奨）
make test
make lint
make onion-check
```

### よく使うコマンド

| コマンド                             | 説明                         |
| ------------------------------------ | ---------------------------- |
| `docker compose up -d`               | コンテナを起動               |
| `docker compose down`                | コンテナを停止               |
| `docker compose exec backend bash`   | バックエンドコンテナに入る   |
| `docker compose exec backend pytest` | テストを実行                 |
| `make test`                          | テストを実行（Makefile経由） |
| `make lint`                          | リンターを実行               |
| `make onion-check`                   | アーキテクチャチェック       |
| `make test-coverage`                 | カバレッジレポートを生成     |

### Makefile活用

プロジェクトには`Makefile`が用意されているため、基本的には**Makeコマンド**を使用してください：

```bash
# テスト実行
make test

# 特定のテストファイルを実行
make test-file FILE=backend/tests/application/test_user_usecase.py

# カバレッジ付きテスト
make test-coverage

# リンター実行
make lint

# アーキテクチャチェック
make onion-check
```

**メリット**:

- docker-composeコマンドを覚える必要がない
- チーム全体で統一されたコマンド
- 複雑なオプションを隠蔽

---

## 2. アーキテクチャの原則

### オニオンアーキテクチャの依存関係

**絶対に守るべきルール**:

- ✅ **Domain層**: 他の層に依存しない（完全に独立）
- ✅ **Application層**: Domain層のみimport可能
- ✅ **Infrastructure層**: Domain, Application層をimport可能（Presentationは不可）
- ✅ **Presentation層**: Application層とDomainのDTOをimport可能
- ✅ **DI層**: すべての層をimport可能（依存性注入のため）

**やってはいけないこと**:

- ❌ Application層でDB操作を直接書く
- ❌ Application層でDBモデル（`infrastructure/db/models`）をimport
- ❌ Application層でInfrastructure層をimport
- ❌ CASCADEを使った削除（論理削除または手動削除ロジックを使用）

### 各層の責務

| 層                 | 書くべきもの                                             | 書いてはいけないもの         |
| ------------------ | -------------------------------------------------------- | ---------------------------- |
| **Domain**         | エンティティ、値オブジェクト、リポジトリインターフェース | DB操作、外部サービス呼び出し |
| **Application**    | ユースケース、DTO、ビジネスロジック                      | DB操作、DBモデルのimport     |
| **Infrastructure** | DBモデル、リポジトリ実装、外部サービス実装               | ビジネスロジック             |
| **Presentation**   | APIエンドポイント、リクエスト/レスポンス定義             | DB操作、ビジネスロジック     |
| **DI**             | 依存性注入の設定                                         | ビジネスロジック             |

---

## 3. コーディング規約

### 基本ルール

- **コメント・docstringは必要最低限**: 本当に必要な時のみ使用
  - コードが自己説明的であるべき
  - 複雑なビジネスロジックや、なぜそうしたかの理由のみコメント
- **型ヒントは必須**: すべての関数、メソッドに型アノテーションを付ける
- **Pydanticを活用**: バリデーションとデータ変換に使用
- **明示的なエラー処理**: 例外は適切にキャッチし、HTTPExceptionに変換

### 命名規則

- **ファイル名**: `snake_case` (例: `user_usecase.py`)
- **クラス名**: `PascalCase` (例: `UserUsecase`, `UserRepository`)
- **関数・変数名**: `snake_case` (例: `get_user`, `user_id`)
- **定数**: `UPPER_SNAKE_CASE` (例: `MAX_RETRY_COUNT`)

### Import順序

```python
# 1. 標準ライブラリ
from typing import List, Optional
from datetime import datetime

# 2. サードパーティライブラリ
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# 3. アプリケーション内のインポート
from app.domain.entities.user import User
from app.application.schemas.user_schemas import UserResponse
from app.infrastructure.db.repositories.user_repository_impl import UserRepositoryImpl
```

---

## 4. 実装パターン

### Entity（Domain層）

```python
from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: Optional[int] = None
    name: str
    email: str

    @classmethod
    def create(cls, name: str, email: str) -> "User":
        # ビジネスルールをここに書く
        return cls(name=name, email=email)
```

### Repository Interface（Domain層）

```python
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.user import User

class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: int) -> Optional[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass
```

### Usecase（Application層）

```python
from app.domain.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.application.schemas.user_schemas import UserCreateRequest, UserResponse

class UserUsecase:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def create_user(self, request: UserCreateRequest) -> UserResponse:
        # エンティティを使ってビジネスロジックを実行
        user = User.create(name=request.name, email=request.email)
        saved_user = self.user_repository.save(user)
        return UserResponse.from_entity(saved_user)
```

### Repository Implementation（Infrastructure層）

```python
from app.domain.repositories.user_repository import UserRepository
from app.domain.entities.user import User
from app.infrastructure.db.models.user_model import UserModel

class UserRepositoryImpl(UserRepository):
    def __init__(self, db):
        self.db = db

    def find_by_id(self, user_id: int) -> Optional[User]:
        user_model = self.db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user_model:
            return None
        return self._to_entity(user_model)

    def _to_entity(self, model: UserModel) -> User:
        return User(
            id=model.id,
            name=model.name,
            email=model.email
        )
```

### API Endpoint（Presentation層）

```python
from fastapi import APIRouter, Depends
from app.application.use_cases.user_usecase import UserUsecase
from app.presentation.schemas.user_schemas import UserCreateRequest, UserResponse
from app.di.user_management import get_user_usecase

router = APIRouter()

@router.post("/users", response_model=UserResponse)
def create_user(
    request: UserCreateRequest,
    usecase: UserUsecase = Depends(get_user_usecase)
):
    return usecase.create_user(request)
```

### DI（DI層）

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from app.application.use_cases.user_usecase import UserUsecase
from app.infrastructure.db.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.db.database import get_db

def get_user_usecase(db: Session = Depends(get_db)) -> UserUsecase:
    user_repository = UserRepositoryImpl(db)
    return UserUsecase(user_repository=user_repository)
```

---

## 5. テスト実装

### テストの基本方針

- **ユニットテスト**: Application層とDomain層を中心にテスト
- **統合テスト**: API エンドポイントのテスト
- **モック**: 外部依存（DB、外部サービス）はモック化

### テストファイルの配置

```
backend/tests/
├── application/          # Application層のテスト
│   └── test_user_usecase.py
├── domain/              # Domain層のテスト
│   └── test_user_entity.py
├── infrastructure/      # Infrastructure層のテスト
│   └── test_user_repository.py
└── presentation/        # Presentation層のテスト
    └── test_user_api.py
```

### テストの書き方

```python
import pytest
from unittest.mock import Mock
from app.application.use_cases.user_usecase import UserUsecase
from app.domain.entities.user import User

def test_create_user():
    # Arrange
    mock_repository = Mock()
    mock_repository.save.return_value = User(id=1, name="Test", email="test@example.com")
    usecase = UserUsecase(user_repository=mock_repository)

    # Act
    request = UserCreateRequest(name="Test", email="test@example.com")
    result = usecase.create_user(request)

    # Assert
    assert result.id == 1
    assert result.name == "Test"
    mock_repository.save.assert_called_once()
```

### テストカバレッジ

- **目標**: 80%以上
- **確認方法**: `make test-coverage`
- **重要**: ビジネスロジックは100%カバーすること

---

## 6. 既存実装の確認

新しい機能を追加する際は、必ず既存の実装パターンを確認してください：

1. **類似機能を探す**: 同じようなユースケースがないか確認
2. **命名規則を守る**: 既存のファイル名・クラス名のパターンに従う
3. **ディレクトリ構造を維持**: 既存の構造を崩さない
4. **テストを参考にする**: 既存のテストコードを確認

---

## 7. 開発フロー

1. **Domain層**: エンティティとリポジトリインターフェースを定義
2. **Application層**: ユースケースとDTOを実装
3. **Infrastructure層**: リポジトリ実装とDBモデルを作成
4. **DI層**: 依存性注入の設定
5. **Presentation層**: APIエンドポイントを実装
6. **テスト**: 各層のテストを作成
7. **アーキテクチャチェック**: `make onion-check`でアーキテクチャ違反がないか確認

---

## 8. よくある間違い

### ❌ Application層でDBモデルをimport

```python
# 間違い
from app.infrastructure.db.models.user_model import UserModel

class UserUsecase:
    def get_user(self, user_id: int) -> UserModel:  # NG
        ...
```

```python
# 正しい
from app.domain.entities.user import User

class UserUsecase:
    def get_user(self, user_id: int) -> User:  # OK
        ...
```

### ❌ Application層でDB操作を直接実行

```python
# 間違い
class UserUsecase:
    def __init__(self, db: Session):
        self.db = db

    def get_user(self, user_id: int):
        return self.db.query(UserModel).filter(...).first()  # NG
```

```python
# 正しい
class UserUsecase:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def get_user(self, user_id: int):
        return self.user_repository.find_by_id(user_id)  # OK
```

---

## 9. チェックリスト

新しい機能を実装する前に確認：

- [ ] BACKEND.mdとapi.mdを読んだ
- [ ] 既存の類似実装を確認した
- [ ] 依存関係のルールを理解した
- [ ] テストの書き方を理解した
- [ ] アーキテクチャチェックの方法を知っている

実装後に確認：

- [ ] 型ヒントをすべてに付けた
- [ ] 不要なコメントを削除した
- [ ] テストを書いた（カバレッジ80%以上）
- [ ] `make onion-check`が通る
- [ ] `make test`が通る
- [ ] `make lint`が通る

---

これらのルールに従ってバックエンド開発を進めてください。
不明点があれば質問してください。
