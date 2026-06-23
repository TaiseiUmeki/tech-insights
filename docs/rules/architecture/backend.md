---
paths: backend/**
---
# バックエンドアーキテクチャガイド

## 目次

1. [オニオンアーキテクチャ概要](#オニオンアーキテクチャ概要)
2. [レイヤーの責務](#レイヤーの責務)
3. [Domain レイヤー](#domain-レイヤー)
4. [Application レイヤー](#application-レイヤー)
5. [Infrastructure レイヤー](#infrastructure-レイヤー)
6. [Presentation レイヤー](#presentation-レイヤー)
7. [DI レイヤー](#di-レイヤー)

---

## オニオンアーキテクチャ概要

オニオンアーキテクチャは、ドメインを中心とした同心円状のレイヤー構造を持つアーキテクチャです。

### 構造

- **中心（Domain）**: ビジネスルール、エンティティ、値オブジェクト
- **第2層（Application）**: ユースケース、ビジネスロジックの調整
- **外側の層（Infrastructure, Presentation）**: 外部接続（DB、API、外部サービス）
- **DI レイヤー**: 全レイヤーを接続し、依存関係を解決する

### 依存ルール

**方向**: 外側から内側のレイヤーへのみ。内側のレイヤーは外側のレイヤーの実装を知ってはならない。

| Layer              | Can import                     | Cannot import                |
| ------------------ | ------------------------------ | ---------------------------- |
| **Domain**         | None (completely independent)  | Everything                   |
| **Application**    | Domain, other Application      | Infrastructure, Presentation |
| **Infrastructure** | Domain, Application            | Presentation                 |
| **Presentation**   | Application, Domain (DTO)      | Infrastructure (direct NG)   |
| **DI**             | Everything (special exception) | -                            |

### 主な制約

- Application レイヤーは Domain レイヤーからのみインポート可能
- DB 操作は Repository インターフェースを経由すること
- DI レイヤーのみ全レイヤーからインポート可能（依存性注入のための特別な例外）
- Application レイヤーは Infrastructure レイヤーを直接インポートしてはならない（DB モデル等）
- Application レイヤーに DB 操作を直接記述してはならない

---

## レイヤーの責務

| Layer              | Responsibility                                            |
| ------------------ | --------------------------------------------------------- |
| **Domain**         | Business rules, entities, repository interfaces           |
| **Application**    | Use cases, business logic coordination                    |
| **Infrastructure** | DB operations, external service implementations           |
| **Presentation**   | API endpoints, request/response                           |
| **DI**             | Dependency injection, layer connections                   |

---

## Domain レイヤー

**役割**: ビジネスドメインの中核であり、ビジネスルールとエンティティを純粋なレイヤーとして定義する。

**ディレクトリ構成**:

```
backend/app/domain/
├── entities/              # Entities
│   └── user.py
├── exceptions/            # Business exceptions
│   └── business_exceptions.py
├── repositories/          # Repository interfaces
│   └── user_repository.py
└── value_objects/         # Value objects
    └── password.py
```

### 1. エンティティ

**記述する内容**:

- ビジネスの中核となるデータ構造
- 基本的には DB テーブル構造に対応する
- エンティティに関する**ビジネスルール**（フィールド操作のルール）

**重要**: エンティティには**ビジネスロジック**を持たせること。単なるデータクラスではない。

**ポイント**:

- ビジネスルールはエンティティに記述する（`create_with_number`、`update_from_request` など）
- ビジネスルールの適用には**値オブジェクトを使用する**（例: 見積番号の生成）
- **DB 操作は行わない**。データ構造とルールのみ。
- Pydantic の `BaseModel` を基底クラスとして使用する。

### 2. 値オブジェクト

**記述する内容**:

- 型定義を超えたルールが必要な場合
- 不変性が重要な値

**ポイント**:

- **不変性**（`frozen = True` - 一度作成したら変更不可）
- **値による等価性**（ID ではなく値で判定）
- **ビジネスルールのカプセル化**（ルールの詳細を Application レイヤーに漏らさない）
- Pydantic の `BaseModel` を使用する。

### 3. リポジトリ（インターフェース）

**記述する内容**:

- Infrastructure レイヤーで実装される DB 操作の**インターフェース**（抽象クラス）
- メソッドのシグネチャのみ定義する（実装は Infrastructure レイヤー）

**重要**:

- **Application レイヤーはこれらのインターフェースを使用する**
- **実装は Infrastructure レイヤーにある**

**ポイント**:

- **Domain レイヤーではインターフェースのみ定義し、実装は書かない**（`pass` のみ）
- 引数と戻り値にはエンティティを使用する
- ビジネスロジックに必要なメソッドを定義する
  - 主に CRUD 操作
  - 複雑なメソッドは query_service を使うこともあるが、本プロジェクトでは全てリポジトリに含める

---

## Application レイヤー

**役割**: アプリケーションロジックの実装。ユースケースを定義し、ビジネスロジックを調整する。

**ディレクトリ構成**:

```
backend/app/application/
├── use_cases/             # Use cases
│   ├── user_usecase.py
│   ├── product_usecase.py
│   └── order_usecase.py
├── interfaces/            # Interface definitions
│   └── external_service.py
└── schemas/               # DTO (Data Transfer Object)
    ├── user_schemas.py
    ├── product_schemas.py
    └── order_schemas.py
```

### 1. スキーマ（DTO）

**記述する内容**:

- データ転送オブジェクト
- Application レイヤーと Presentation レイヤーで使用する
- エンティティとは分離する（エンティティはビジネスルール用、DTO はデータ転送用）

**ポイント**:

- Pydantic の `BaseModel` を使用する
- Application レイヤーと Presentation レイヤーで共有することがある
- エンティティとは別に定義する（エンティティは内部ロジック用、DTO はデータ転送用）

### 2. ユースケース

**記述する内容**:

- 各エンドポイントに対するビジネスロジック
- DB 操作に関連するロジック

**主な制約**:

- Domain レイヤーと他の Application レイヤーからのみインポート可能
- DB 操作を直接記述してはならない（Domain のリポジトリを使用する）
- DB モデルを使用してはならない（エンティティを使用する）

**ポイント**:

- クラスのコンストラクタでリポジトリインターフェースを受け取る
  - **外部サービス（S3、CloudFront 等）には、実装ではなくインターフェースを使用する**
- ビジネスルールの適用には**エンティティと値オブジェクトを使用する**（直接記述しない）
- 結果を DTO に変換して返す

---

## Infrastructure レイヤー

**役割**: 外部インターフェースとの連携。DB 操作、外部サービス（S3、Redis、Qdrant 等）の実装。

**ディレクトリ構成**:

```
backend/app/infrastructure/
├── db/
│   ├── models/                    # DB models
│   │   ├── base.py
│   │   └── user_model.py
│   ├── repositories/              # Repository implementations
│   │   └── user_repository_impl.py
│   └── session.py                 # DB session management
├── security/                      # Security services
│   └── security_service_impl.py
└── logging/                       # Logging services
    └── logging.py
```

### 1. モデル（DB モデル）

**記述する内容**:

- SQLAlchemy の DB モデル
- テーブル定義、カラム定義、リレーション定義

**注意**:

- CASCADE は非推奨
- 論理削除を使用するか、Application または Infrastructure/Repository に順次削除ロジックを記述する

**ポイント**:

- SQLAlchemy の `Base` を継承する
- **基本的に CASCADE は使わない**（論理削除または手動での削除ロジックを推奨）

### 2. リポジトリ実装

**記述する内容**:

- Domain レイヤーで定義されたリポジトリインターフェースの**実装**
- 具体的な DB 操作の処理
- DB モデル <-> エンティティの変換

**ポイント**:

- リポジトリインターフェースを継承する（例: `UserRepository`）
- **Domain レイヤーで定義された全メソッドを実装すること**
- 再利用性のために変換メソッド（`to_entity` 等）を用意する。戻り値はエンティティで返す

**新しいメソッドを追加する場合**:

1. Domain レイヤーのリポジトリインターフェースにメソッドを追加する
2. Infrastructure レイヤーのリポジトリ実装にそのメソッドを実装する

### 3. その他の外部サービス

**記述する内容**:

- Redis、AWS S3、Qdrant 等の外部サービスとの連携
- `backend/app/infrastructure/` に実装する

---

## Presentation レイヤー

**役割**: ユーザーインターフェース。API エンドポイントの定義とリクエスト/レスポンスのハンドリング。

**ディレクトリ構成**:

```
backend/app/presentation/
├── api/                    # API endpoints
│   ├── auth_api.py
│   └── user_api.py
├── handlers.py             # Exception handlers (domain exceptions → HTTP responses)
└── schemas/                # Request/response definitions
    ├── auth_schemas.py
    └── user_schemas.py
```

### 1. スキーマ（リクエスト/レスポンス）

**記述する内容**:

- リクエストとレスポンスの定義
- Pydantic によるバリデーション

### 2. API（エンドポイント）

**記述する内容**:

- FastAPI のルーター定義
- エンドポイントの実装
- ユースケースの呼び出し
- 認証・認可（Depends）

**ポイント**:

- 依存性注入には `Depends` を使用する
  - `get_xxxx_usecase`: ユースケースの注入（詳細は後述）
  - `get_current_company_id`: 現在のユーザーの企業 ID を取得する（認証済み）
- エンドポイントでは基本的に**ユースケースのメソッドを呼ぶだけ**にする
- Application レイヤーの DTO を Presentation レイヤーのレスポンスに変換する（`from_domain` メソッド等）
- 例外をハンドリングして HTTP エラーに変換する

---

## DI レイヤー

**ディレクトリ構成**:

```
backend/app/di/
├── user_management.py
├── product_management.py
├── order_management.py
└── ...
```

**役割**: 依存性注入。レイヤー間の接続と依存関係の解決。

**記述する内容**:

- 各エンドポイントへの依存関係を注入する関数
- ユースケースのインスタンスを生成し、必要なリポジトリを注入する

**重要**:

- **このレイヤーのみ Application、Domain、Infrastructure からインポート可能**

**ポイント**:

- `get_db` で DB セッションを取得する（FastAPI の `Depends`）
- リポジトリ実装のインスタンスを生成する（例: `UserRepositoryImpl`）
- 外部サービスのインスタンスを生成する（例: `S3Service`）
- リポジトリと外部サービスをユースケースに注入する
- 複数のリポジトリや外部サービスが必要なケースに対応する

**使い方**:

- Presentation レイヤーの API エンドポイントで以下のように使用する:
  ```python
  @router.get("/users")
  def get_users(
      user_usecase: UserUsecase = Depends(get_user_usecase)  # <- DI
  ):
      # user_usecase には既に依存関係が注入されている
      result = user_usecase.get_users(...)
  ```

---

## アーキテクチャ検証

本プロジェクトでは、オニオンアーキテクチャの原則が守られているかを自動検証する仕組みを備えています。

### アーキテクチャチェックの実行

```bash
# Task を使用
task onion-check

# 直接実行
python backend/scripts/check_onion_architecture.py
```

### CI/CD との統合

バックエンドコードに影響するプルリクエストに対して、GitHub Actions でアーキテクチャチェックが自動実行されます。詳細は `.github/workflows/backend-ci.yml` を参照してください。

チェッカーは以下を検証します:

- Domain レイヤーが他のレイヤーに依存していないこと
- Application レイヤーが Domain のみに依存していること
- Infrastructure レイヤーが Presentation に依存していないこと
- モジュール間に循環依存がないこと

---

## ベストプラクティス

1. **Domain レイヤーを純粋に保つ**: 外部依存なし、ビジネスロジックのみ
2. **インターフェースを使用する**: Domain でインターフェースを定義し、Infrastructure で実装する
3. **依存の方向**: 常に外側から内側のレイヤーへ
4. **循環依存を避ける**: 各レイヤーが明確な責務を持つこと
5. **値オブジェクトを使用する**: ビジネスルールを不変の値オブジェクトにカプセル化する
6. **DTO とエンティティを分離する**: エンティティはビジネスロジック用、DTO はデータ転送用
7. **独立したテスト**: Domain レイヤーと Application レイヤーは Infrastructure なしでテスト可能にする
