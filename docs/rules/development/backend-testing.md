# バックエンド テスト実装方針

## 目次

- [共通ルール](#共通ルール)
  - [ディレクトリ構成](#1-ディレクトリ構成)
  - [テスト命名規則](#2-テスト命名規則)
  - [Factory as Fixture パターン](#3-factory-as-fixture-パターン)
  - [Fake パターン（MagicMock 不使用）](#4-fake-パターンmagicmock-不使用)
  - [共有基盤（support/）](#5-共有基盤support)
  - [ファクトリ（factories/）](#6-ファクトリfactories)
- [単体テスト方針](#単体テスト方針)
  - [テスト対象と責務](#71-テスト対象と責務)
  - [依存関係の扱い](#72-依存関係の扱い)
  - [単体テストの例](#73-単体テストの例)
- [結合テスト方針](#結合テスト方針)
  - [テスト対象と責務](#81-テスト対象と責務)
  - [DB セットアップ](#82-db-セットアップ)
  - [HTTP クライアント](#83-http-クライアント)
  - [認証・認可のバイパス](#84-認証認可のバイパス)
  - [外部サービスのモック](#85-外部サービスのモック)
  - [API 結合テストの例](#86-api-結合テストの例)
  - [Repository 結合テストの例](#87-repository-結合テストの例)

---

## 共通ルール

### 1. ディレクトリ構成

```
tests/
├── conftest.py                              # DB engine, session
│
├── support/                                 # 単体・結合の両方から使う共有基盤
│   ├── __init__.py
│   ├── auth.py                              # default_mock_user(), default_mock_superuser(), default_auth_headers()
│   └── module_stubs.py                      # OCC/weasyprint モック登録 install()
│
├── factories/                               # テストデータ生成 (build / create)
│   ├── __init__.py
│   ├── account_management.py                # build_company, create_company, build_employee, create_employee, create_base_seed
│   ├── item_management.py                   # build_item, create_item, build_create_item_request
│   ├── bom_management.py
│   ├── project_management.py
│   ├── document_management.py
│   ├── module_management.py
│   ├── quotation_management.py
│   ├── customer_management.py
│   ├── admin_management.py
│   └── ai_agents.py
│
├── unit/
│   ├── conftest.py                          # unit 共通 (module_stubs.install() だけ)
│   ├── fakes/                               # 単体テスト用 Fake クラス
│   │   ├── __init__.py
│   │   └── fake_xxx_repository.py
│   ├── domain/                              # VO・Entity・DomainService の純粋ロジック
│   │   ├── conftest.py
│   │   ├── item_management/
│   │   │   ├── __init__.py
│   │   │   ├── test_revision_number.py
│   │   │   ├── test_ulid.py
│   │   │   ├── test_item_entity.py
│   │   │   └── test_deletion_result.py
│   │   ├── quotation_management/
│   │   │   └── ...
│   │   └── bom_management/
│   │       └── ...
│   └── application/                         # Usecase（リポジトリは Fake）
│       ├── conftest.py
│       ├── item_management/
│       │   ├── __init__.py
│       │   ├── test_item_usecase_create.py
│       │   └── test_item_usecase_delete.py
│       ├── quotation_management/
│       │   └── ...
│       └── document_management/
│           └── ...
│
└── integration/
    ├── conftest.py                          # テーブル作成, 認証モック, httpx client
    ├── api/                                 # API 結合テスト（HTTP → DB）
    │   ├── conftest.py
    │   ├── account_management/
    │   ├── item_management/
    │   ├── bom_management/
    │   ├── project_management/
    │   ├── document_management/
    │   ├── module_management/
    │   ├── quotation_management/
    │   ├── admin_management/
    │   ├── ai_agents/
    │   └── customer_management/
    └── repository/                          # Repository 結合テスト（Repository → DB）
        ├── conftest.py
        ├── item_management/
        │   ├── __init__.py
        │   ├── test_item_repository.py
        │   └── test_drawing_file_repository.py
        ├── quotation_management/
        └── customer_management/
```

#### ルール

- **`support/`**: 認証ヘルパーやモジュールスタブなど、単体・結合の両方で使う共有基盤を配置する
- **`factories/`**: ドメインごとにファクトリモジュールを配置し、`build_xxx`（メモリのみ）/ `create_xxx`（DB 永続化）を提供する
- **`unit/fakes/`**: 単体テスト専用の Fake クラスを配置する（結合テストでは実装を使うため不要）
- **`unit/`**: レイヤー構造（`domain` / `application`）に対応させる
- **`integration/api/`**: ドメイン単位でディレクトリを分け、HTTP → DB の一連のフローを検証する
- **`integration/repository/`**: ドメイン単位でディレクトリを分け、Repository → DB の永続化ロジックを検証する

---

### 2. テスト命名規則

#### ファイル名

| テスト種別 | 形式 | 例 |
|-----------|------|-----|
| Domain 単体 | `test_{対象}.py` | `test_revision_number.py` |
| Application 単体 | `test_{usecase名}_{操作}.py` | `test_item_usecase_create.py` |
| API 結合 | `test_{対象}_api.py` | `test_customer_api.py` |
| Repository 結合 | `test_{対象}_repository.py` | `test_item_repository.py` |

#### テストクラス名

```
Test{対象クラス名}
```

例: `TestRevisionNumber`, `TestItemUsecaseCreate`, `TestCustomerApi`, `TestItemRepository`

#### テストメソッド名

```
test_{日本語でテスト内容を記述}
```

例:
- `test_正常にジョブを生成しエンキューする`
- `test_完了済みジョブはエラーを返す`
- `test_存在しないファイルIDで404を返す`
- `test_テナント分離で他社データが見えない`

#### ルール

- テストメソッド名は日本語で、**テストの意図**が伝わるように記述する
- 「〜する」「〜を返す」「〜が発生する」など、期待される結果を明記する
- テストクラスは1つのテスト対象クラス/関数に対応させる

---

### 3. Factory as Fixture パターン

テストデータの生成には、**`factories/` モジュールに定義したファクトリ関数**を使用する。

#### build と create の使い分け

| 関数 | 用途 | DB 操作 | 使用場面 |
|------|------|---------|---------|
| `build_xxx` | メモリ上にオブジェクトを生成 | なし | 単体テスト、リクエストデータ生成 |
| `create_xxx` | DB にレコードを挿入して返す | `db_session.add` + `flush` | 結合テスト |

#### 基本形

```python
# factories/item_management.py

from app.infrastructure.db.models import ItemModel


def build_item(**overrides) -> ItemModel:
    """メモリ上に Item を生成（DB 永続化なし）"""
    defaults = {
        "name": "テスト製品",
        "company_id": 1,
        "revision_set_id": 1,
        "revision_number": 1,
        "is_latest": True,
        "created_by": 1,
    }
    defaults.update(overrides)
    return ItemModel(**defaults)


def create_item(db_session, **overrides) -> ItemModel:
    """DB に Item を挿入して返す"""
    item = build_item(**overrides)
    db_session.add(item)
    db_session.flush()
    return item


def build_create_item_request(**overrides) -> dict:
    """API リクエストボディを生成"""
    defaults = {
        "name": "テスト製品",
        "item_type": "product",
    }
    defaults.update(overrides)
    return defaults
```

#### fixture として公開

```python
# conftest.py（ルート or 各レベル）

from tests.factories import item_management as item_factory


@pytest.fixture
def create_item(db_session):
    def _factory(**overrides):
        return item_factory.create_item(db_session, **overrides)
    return _factory


@pytest.fixture
def build_item():
    return item_factory.build_item
```

#### ルール

- ファクトリ関数は `factories/{domain}.py` に定義する
- `**overrides` パターンで全フィールドのデフォルト値をカスタマイズ可能にする
- `build_xxx` は DB 不要、`create_xxx` は `db_session` を第一引数に取る
- `create_base_seed` のような共通シードデータ生成関数もファクトリに含める

---

### 4. Fake パターン（MagicMock 不使用）

依存オブジェクトのモックには **MagicMock ではなく、明示的な Fake クラス**を実装する。

#### 基本形

```python
# unit/fakes/fake_drawing_repository.py

from app.domain.item_management.repositories import IDrawingFileRepository
from app.domain.item_management.entities import DrawingFile


class FakeDrawingFileRepository(IDrawingFileRepository):
    """テスト用の Fake リポジトリ"""

    def __init__(self) -> None:
        self.items: dict[int, DrawingFile] = {}
        self.save_called_count = 0

    async def find_by_id(self, id: int) -> DrawingFile | None:
        return self.items.get(id)

    async def save(self, entity: DrawingFile) -> DrawingFile:
        self.save_called_count += 1
        self.items[entity.id] = entity
        return entity
```

#### Fake を fixture として提供

```python
# unit/conftest.py

@pytest.fixture
def fake_drawing_repository():
    return FakeDrawingFileRepository()
```

#### なぜ Fake を使うのか

| 観点 | MagicMock | Fake |
|------|-----------|------|
| 型安全性 | 低（存在しないメソッドも呼べる） | 高（インターフェース準拠を強制） |
| 可読性 | 低（振る舞いが `return_value` 等で散在） | 高（振る舞いがクラス定義で明確） |
| IDE サポート | 弱（補完・リファクタリング不可） | 強（補完・リファクタリング可能） |
| エラー検出 | 実行時 | コーディング時（型チェック） |
| メンテナンス | インターフェース変更時に気づきにくい | インターフェース変更時にコンパイルエラー |

#### ルール

- Fake クラスは対応するドメインインターフェース（ABC）を継承する
- Fake クラス名は `Fake{対象クラス名}` で統一する
- 検証用のカウンタやログが必要な場合は Fake クラスの属性として持たせる
- **`unit/fakes/` に配置する**（単体テスト専用。結合テストでは実装を使うため Fake は不要）

---

### 5. 共有基盤（support/）

`support/` には単体・結合テストの両方で使う共通ヘルパーを配置する。

#### auth.py

```python
# support/auth.py

def default_mock_user() -> dict:
    """テスト用デフォルトユーザー"""
    return {
        "id": 1,
        "company_id": 1,
        "employee_id": 1,
        "name": "テストユーザー",
        "is_superuser": False,
    }


def default_mock_superuser() -> dict:
    """テスト用スーパーユーザー"""
    return {
        "id": 999,
        "company_id": 1,
        "employee_id": 999,
        "name": "管理者ユーザー",
        "is_superuser": True,
    }


def default_auth_headers() -> dict:
    """テスト用認証ヘッダー"""
    return {"Authorization": "Bearer test-token"}
```

#### module_stubs.py

```python
# support/module_stubs.py

import sys
from unittest.mock import MagicMock


def install() -> None:
    """ローカル環境に存在しないモジュールをスタブに置き換える"""
    for mod in ("OCC", "OCC.Extend", "OCC.Extend.DataExchange"):
        sys.modules.setdefault(mod, MagicMock())

    # weasyprint 等、必要に応じて追加
```

---

### 6. ファクトリ（factories/）

#### account_management.py（共通シード）

```python
# factories/account_management.py

def build_company(**overrides) -> CompanyModel:
    defaults = {"name": "テスト株式会社"}
    defaults.update(overrides)
    return CompanyModel(**defaults)


def create_company(db_session, **overrides) -> CompanyModel:
    company = build_company(**overrides)
    db_session.add(company)
    db_session.flush()
    return company


def create_base_seed(db_session) -> dict:
    """結合テストで必要な最低限のマスタデータを一括作成"""
    company = create_company(db_session)
    employee = create_employee(db_session, company_id=company.id)
    return {"company": company, "employee": employee}
```

#### ルール

- 各ドメインに1ファイル（`factories/{domain}.py`）
- `build_xxx`: メモリのみ生成（単体テスト用）
- `create_xxx`: DB 永続化（結合テスト用）
- `create_base_seed`: 複数ドメインをまたぐ共通シードデータ
- 他ドメインのファクトリを呼ぶ場合は明示的に import する

---

## 単体テスト方針

### 7.1 テスト対象と責務

単体テストでは、**外部依存を一切持たず**、1つのクラス/関数のロジックを検証する。

| ディレクトリ | テスト対象 | 検証内容 |
|------------|-----------|---------|
| `unit/domain/` | エンティティ、値オブジェクト、ドメインサービス | ビジネスロジック、バリデーション |
| `unit/application/` | ユースケース | 依存呼び出しの順序・引数、戻り値の変換 |

### 7.2 依存関係の扱い

単体テストでは **全ての外部依存を Fake に置き換える**。

```
テスト対象 (Usecase)
    ├── FakeXxxRepository      ← DB アクセスの代替
    ├── FakeYyyService         ← 外部サービスの代替
    └── FakeZzzQueue           ← メッセージキューの代替
```

- DB 接続は行わない
- 外部 API（S3, OpenAI 等）は呼ばない
- ファイルシステム操作は行わない

#### conftest.py の役割

```python
# unit/conftest.py

from tests.support import module_stubs

# ローカル環境に無いモジュールをスタブ化
module_stubs.install()
```

```python
# unit/application/conftest.py

from tests.unit.fakes.fake_drawing_repository import FakeDrawingFileRepository


@pytest.fixture
def fake_drawing_repository():
    return FakeDrawingFileRepository()


@pytest.fixture
def create_run_job_usecase(fake_drawing_repository, fake_status_service):
    """RunDrawingProcessingJobUsecase のファクトリ fixture"""
    def _factory(**overrides):
        defaults = {
            "drawing_file_repository": fake_drawing_repository,
            "status_service": fake_status_service,
        }
        defaults.update(overrides)
        return RunDrawingProcessingJobUsecase(**defaults)
    return _factory
```

### 7.3 単体テストの例

#### Domain テスト

```python
# unit/domain/item_management/test_revision_number.py

from tests.factories.item_management import build_item


class TestRevisionNumber:
    def test_リビジョン番号は1以上である(self, build_item):
        item = build_item(revision_number=1)
        assert item.revision_number >= 1

    def test_リビジョン番号0はバリデーションエラー(self):
        with pytest.raises(ValueError):
            build_item(revision_number=0)
```

#### Application テスト

```python
# unit/application/item_management/test_item_usecase_create.py

class TestItemUsecaseCreate:
    async def test_正常に製品を作成する(
        self,
        create_item_usecase,
        fake_item_repository,
    ):
        usecase = create_item_usecase()
        result = await usecase.create_item(name="新規製品", item_type="product")

        assert result.name == "新規製品"
        assert fake_item_repository.save_called_count == 1

    async def test_重複名でエラーを返す(
        self,
        create_item_usecase,
        fake_item_repository,
    ):
        fake_item_repository.existing_names = ["既存製品"]
        usecase = create_item_usecase()

        with pytest.raises(DuplicateItemException):
            await usecase.create_item(name="既存製品", item_type="product")
```

---

## 結合テスト方針

### 8.1 テスト対象と責務

結合テストは **API 結合テスト**と **Repository 結合テスト**の2種類に分かれる。

#### API 結合テスト（`integration/api/`）

HTTP リクエストから DB 操作までの一連のフローを検証する。

```
HTTP リクエスト → API Router → Usecase → Repository → DB（実 PostgreSQL）
```

| 検証内容 | 具体例 |
|---------|--------|
| API エンドポイントの正常動作 | CRUD 操作、ステータスコード、レスポンス形式 |
| DB 永続化 | データの保存・取得・更新・削除が正しく行われる |
| テナント分離 | 他社のデータが見えない |
| バリデーション | 不正リクエストへのエラーレスポンス |
| エラーハンドリング | ドメイン例外 → HTTP ステータスコード変換 |

#### Repository 結合テスト（`integration/repository/`）

Repository 実装と DB の連携を検証する。

```
Repository 実装 → SQLAlchemy → DB（実 PostgreSQL）
```

| 検証内容 | 具体例 |
|---------|--------|
| CRUD 操作 | 保存・取得・更新・削除が正しく動く |
| クエリの正確性 | フィルタ・ソート・ページネーションが正しい |
| リレーション | JOIN、eager/lazy loading が期待通り |
| ユニーク制約 | 重複時に適切なエラーが発生する |
| テナント分離 | `company_id` によるデータ分離 |

### 8.2 DB セットアップ

結合テストでは**実 PostgreSQL に接続**し、トランザクションロールバックでテスト間の分離を保証する。

```python
# tests/conftest.py（ルート）

@pytest.fixture(scope="session")
def db_engine():
    """テスト用 DB エンジン（セッション共有）"""
    uri = os.environ.get("DATABASE_URI")
    if not uri:
        pytest.skip("DATABASE_URI が設定されていません")
    engine = create_engine(uri)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    """テストごとにロールバックする DB セッション"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
```

#### テストデータの準備

```python
# integration/api/item_management/conftest.py

from tests.factories import account_management as account_factory
from tests.factories import item_management as item_factory


@pytest.fixture
def base_seed(db_session):
    """テストに必要な最低限のマスタデータ"""
    return account_factory.create_base_seed(db_session)


@pytest.fixture
def create_item(db_session):
    def _factory(**overrides):
        return item_factory.create_item(db_session, **overrides)
    return _factory
```

### 8.3 HTTP クライアント

`httpx.AsyncClient` + `ASGITransport` を使用する。

```python
# integration/conftest.py

@pytest.fixture
async def client(app):
    """認証済み非同期テストクライアント"""
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client
```

### 8.4 認証・認可のバイパス

```python
# integration/conftest.py

from tests.support.auth import default_mock_user


@pytest.fixture
def app(db_session):
    """テスト用 FastAPI アプリ"""
    from app.app import app

    # DB セッションをテスト用に差し替え
    app.dependency_overrides[get_db] = lambda: db_session

    # 認証バイパス（support/auth.py の共通ヘルパーを使用）
    app.dependency_overrides[get_current_user] = lambda: default_mock_user()

    # 認可（ABAC）バイパス
    mock_authz = FakeAuthorizationUsecase()  # Fake で実装
    app.dependency_overrides[get_authorization_usecase] = lambda: mock_authz

    yield app

    app.dependency_overrides.clear()
```

### 8.5 外部サービスのモック

結合テストでは **DB は実物を使い、外部サービスは `dependency_overrides` で差し替える**。

| サービス | 方針 | 理由 |
|---------|------|------|
| PostgreSQL | 実接続 | 結合テストの主目的 |
| S3 / CloudFront | `dependency_overrides` で差し替え | ファイルストレージは結合テスト範囲外 |
| Qdrant（ベクトル DB） | `dependency_overrides` で差し替え | ローカル環境に構築が難しい |
| OpenAI / Claude API | `dependency_overrides` で差し替え | コスト・速度の観点 |
| Redis | 環境に応じて | CI で利用可能なら実接続 |

### 8.6 API 結合テストの例

```python
# integration/api/customer_management/test_customer_api.py

from tests.factories import customer_management as customer_factory


class TestCustomerApi:
    async def test_取引先を作成して取得する(self, client, base_seed):
        # 作成
        response = await client.post(
            "/v1/customers",
            json=customer_factory.build_create_customer_request(),
        )
        assert response.status_code == 201
        customer_id = response.json()["id"]

        # 取得
        response = await client.get(f"/v1/customers/{customer_id}")
        assert response.status_code == 200
        assert response.json()["name"] == "テスト取引先"

    async def test_存在しない取引先で404を返す(self, client, base_seed):
        response = await client.get("/v1/customers/99999")
        assert response.status_code == 404

    async def test_テナント分離で他社データが見えない(
        self,
        client,
        create_customer,
        app,
        base_seed,
    ):
        # Company A のデータを作成
        customer = create_customer(company_id=base_seed["company"].id)

        # Company B のユーザーとしてアクセス
        app.dependency_overrides[get_current_user] = lambda: {
            "id": 2,
            "company_id": 999,
            "employee_id": 2,
            "name": "他社ユーザー",
        }

        response = await client.get("/v1/customers")
        items = response.json()["items"]
        assert not any(item["id"] == customer.id for item in items)

    async def test_バリデーション失敗で422を返す(self, client, base_seed):
        response = await client.post(
            "/v1/customers",
            json={"name": ""},  # 空の名前
        )
        assert response.status_code == 422
```

### 8.7 Repository 結合テストの例

```python
# integration/repository/item_management/test_item_repository.py

from tests.factories import account_management as account_factory
from tests.factories import item_management as item_factory


class TestItemRepository:
    def test_製品を保存して取得する(self, db_session):
        seed = account_factory.create_base_seed(db_session)
        repo = ItemRepositoryImpl(db_session)

        item = item_factory.create_item(
            db_session,
            company_id=seed["company"].id,
            created_by=seed["employee"].id,
        )

        found = repo.find_by_id(item.id, company_id=seed["company"].id)
        assert found is not None
        assert found.name == item.name

    def test_他社の製品は取得できない(self, db_session):
        seed = account_factory.create_base_seed(db_session)
        repo = ItemRepositoryImpl(db_session)

        item = item_factory.create_item(
            db_session,
            company_id=seed["company"].id,
        )

        found = repo.find_by_id(item.id, company_id=999)
        assert found is None

    def test_ユニーク制約違反でエラー(self, db_session):
        seed = account_factory.create_base_seed(db_session)

        item_factory.create_item(
            db_session,
            company_id=seed["company"].id,
            revision_set_id=1,
            revision_number=1,
        )

        with pytest.raises(IntegrityError):
            item_factory.create_item(
                db_session,
                company_id=seed["company"].id,
                revision_set_id=1,
                revision_number=1,
            )
```
