---
description: オニオンアーキテクチャに沿ったバックエンドリファクタリングガイド
---

# オニオンアーキテクチャ リファクタリングガイド

まず以下のドキュメントを確認してください:

## @document/architecture/BACKEND.md

## リファクタリングの原則

### 1. Usecaseは「調整役」に徹する

理想のUsecaseは**ハードコーディングされたロジックがほとんどなく、repository・domainルールを呼び出すだけ**の形。

**Before（悪い例）**:

```python
class ProductUsecase:
    def create(self, input_dto, company_id):
        # ❌ Usecaseにビジネスルールが直書きされている
        product = Product(
            company_id=company_id,
            uuid=UUID(value=uuid_lib.uuid4()),
            code=Code(value=input_dto.code),
            name=input_dto.name,
            ...
        )
        created = self._product_repository.create(product)
        return ProductOutputDTO(
            id=created.id,
            uuid=str(created.uuid.value),
            code=created.code.value,
            ...
        )
```

**After（良い例）**:

```python
class ProductUsecase:
    def create(self, input_dto: ProductInputDTO, company_id: int) -> ProductOutputDTO:
        # ✅ Entityのcreateメソッドでドメインルールを適用
        product = Product.create(input_dto.to_entity(company_id))
        created = self._product_repository.create(product)
        return ProductOutputDTO.from_entity(created)
```

### 2. Domainルールはdomain層に集約する（Domain渇望症を避ける）

Usecaseに散らばっているビジネスロジックは、以下のdomain層の適切な場所に移す:

| 移動先             | 判断基準                                                   |
| ------------------ | ---------------------------------------------------------- |
| **Entity**         | そのEntityのフィールドに対するルール（create, updateなど） |
| **Value Object**   | 不変値に対するルール（フォーマット、バリデーション）       |
| **Domain Service** | 複数のEntityにまたがるルール                               |

### 3. プライベート関数の方針

- **繰り返し使われていない & 今後再利用の見込みがない** → 切り出さない（インラインで書く）
- **同じロジックがドメインルールとして統一できる** → domain層のentity/value_object/domain_serviceに移行
- プライベート関数を作る目的は「再利用」と「ドメインルール明確化」のみ。読みやすさのためだけに切り出さない

### 4. 変換メソッドの統一パターン（schema ↔ DTO ↔ Entity）

各層のデータ変換は`from_xxx`/`to_xxx`のクラスメソッドで統一する:

```python
# Application層 DTO
class ProductInputDTO(BaseModel):
    code: str
    name: str
    ...

    def to_entity(self, company_id: int) -> Product:
        return Product(
            company_id=company_id,
            uuid=UUID(value=uuid_lib.uuid4()),
            code=Code(value=self.code),
            name=self.name,
            ...
        )

class ProductOutputDTO(BaseModel):
    id: int
    uuid: str
    ...

    @classmethod
    def from_entity(cls, entity: Product, **kwargs) -> "ProductOutputDTO":
        return cls(
            id=entity.id,
            uuid=str(entity.uuid.value),
            code=entity.code.value,
            name=entity.name,
            ...
            **kwargs,
        )

# Presentation層 Schema
class ProductResponse(BaseModel):
    ...

    @classmethod
    def from_dto(cls, dto: ProductOutputDTO) -> "ProductResponse":
        return cls(**dto.model_dump())
```

### 5. エラーハンドリング

- domain層の`exceptions/business_exceptions.py`で定義されたExceptionを**raiseするだけ**
- `main.py`の`exception_handler`で一括キャッチ → HTTPレスポンスに変換
- **try/exceptによる過度なフォールバック処理は作らない**（ユーザーが指示するまで不要）
- 不要なtry/exceptがあれば削除する

```python
# ✅ Good: domain exceptionをraiseするだけ
def get_by_uuid(self, uuid: str, company_id: int) -> ProductOutputDTO:
    product = self._product_repository.get_by_uuid(uuid, company_id)
    if not product:
        raise ResourceNotFoundError(f"Product with uuid {uuid} not found")
    return ProductOutputDTO.from_entity(product)

# ❌ Bad: 過度なフォールバック
def get_by_uuid(self, uuid: str, company_id: int) -> ProductOutputDTO:
    try:
        product = self._product_repository.get_by_uuid(uuid, company_id)
        if not product:
            raise ResourceNotFoundError(...)
        return ProductOutputDTO.from_entity(product)
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise BusinessLogicError("Failed to get product")
```

### 6. 重複ユーティリティの共通化

複数のUsecaseで同じヘルパー関数が重複している場合は共通モジュールに抽出する。

**現状の問題例**: `_build_pagination_meta`が7つのUsecaseファイルで重複定義されている。

```python
# ✅ Good: application/shared/pagination.py に共通化
def build_pagination_meta(page: int, page_size: int, total: int) -> dict:
    return {
        "current_page": page,
        "page_size": page_size,
        "total_items": total,
        "total_pages": (total + page_size - 1) // page_size,
    }
```

ただし「1箇所でしか使われていないヘルパー」は共通化しない。2箇所以上で重複して初めて抽出する。

### 7. Entity更新パターン

Usecaseでフィールドを1つずつ手動代入するのではなく、Entityに`update_from`メソッドを持たせる:

```python
# ❌ Bad: Usecaseでフィールドを1つずつ代入
update_data = update_dto.model_dump(exclude_unset=True)
if "code" in update_data:
    existing.code = Code(value=update_data["code"])
if "name" in update_data:
    existing.name = update_data["name"]
# ... 延々と続く

# ✅ Good: Entityに更新ロジックを持たせる
class Product(BaseModel):
    def update_from(self, update_data: dict) -> "Product":
        fields = {}
        if "code" in update_data:
            fields["code"] = Code(value=update_data["code"])
        if "name" in update_data:
            fields["name"] = update_data["name"]
        # ... Entityのビジネスルールとして集約
        return self.model_copy(update=fields)

# Usecaseは呼ぶだけ
updated_entity = existing.update_from(update_dto.model_dump(exclude_unset=True))
```

### 8. Domain Serviceのインスタンス化パターン

Domain ServiceがRepositoryインターフェースを必要とする場合、Usecaseのコンストラクタで生成する:

```python
# ✅ Good: UsecaseがDomain Serviceを組み立てる
class ProductUsecase:
    def __init__(
        self,
        product_repository: IProductRepository,
        attribute_definition_repository: IAttributeDefinitionRepository,
    ):
        self._product_repository = product_repository
        # Domain ServiceにRepositoryインターフェースを渡す
        self._attributes_validator = AttributesValidator(attribute_definition_repository)
```

Domain Serviceはdomain層に属するが、Repositoryインターフェース（同じくdomain層）を受け取るだけなのでアーキテクチャ違反にならない。

### 9. Usecaseでプライベートメソッドが許容されるケース

原則は「切り出さない」だが、以下のケースでは許容する:

| 許容                                             | 理由                             |
| ------------------------------------------------ | -------------------------------- |
| 同じUsecase内で**2回以上**呼ばれる               | 実際の重複排除                   |
| 複数repositoryの**オーケストレーション**ロジック | ドメインルールではなくフロー制御 |

```python
# ✅ 許容: 2箇所から呼ばれるオーケストレーション
def _create_default_layout(self, company_id, user_id) -> DashboardLayout:
    # 複数repositoryを組み合わせてデフォルトレイアウトを構築
    ...
```

ドメインルールに該当するものは許容せず、必ずdomain層に移動する。

### 10. コメントは最小限

- 自明なコードにコメントは不要
- 「なぜそうしたか」のみコメント（「何をしているか」は書かない）
- docstringは基本不要

---

## リファクタリング手順

対象ファイルを指定して実行してください。以下の手順で進めます:

### Step 1: 現状把握

対象のusecase, schema, entity, presentation層のファイルを読む。

### Step 2: Domain層の強化

1. Entityに`create`/`update_from`などのファクトリメソッド・更新メソッドを追加
2. Usecaseに散らばっているビジネスルールをEntityまたはValue Object/Domain Serviceに移動
3. 不要なプライベート関数を特定（再利用されていない＆ドメインルールでない → インライン化 or 削除）

### Step 3: 変換メソッドの導入

1. DTOに`to_entity`メソッドを追加（Input系）
2. DTOに`from_entity`クラスメソッドを追加（Output系）
3. Presentation SchemaとDTOの変換が必要な場合は`from_dto`を追加
4. Usecase内の手動変換コードを変換メソッド呼び出しに置換

### Step 4: Usecaseの簡素化

1. ハードコーディングされたロジックをdomain層呼び出しに置換
2. 不要なtry/exceptを削除
3. 不要なコメント・loggerを削除
4. 結果: Usecaseはrepositoryとdomain呼び出しだけの薄い層になる

### Step 5: 検証

```bash
task check-onion   # アーキテクチャ違反チェック
task test-unit     # テスト通過確認
task check         # format + lint + mypy + onion-check
```

---

## チェックリスト

リファクタリング後に確認:

- [ ] Usecaseにハードコーディングされたビジネスルールが残っていない
- [ ] 変換処理が`from_entity`/`to_entity`/`from_dto`で統一されている
- [ ] 不要なプライベート関数が排除されている（再利用されないものは切り出さない）
- [ ] domain層に移せるロジックがUsecase/Presentation層に残っていない
- [ ] try/exceptによる過度なフォールバックがない
- [ ] コメントが最小限
- [ ] `task check-onion` が通る
- [ ] `task test-unit` が通る
