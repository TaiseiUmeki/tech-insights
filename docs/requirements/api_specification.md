# API仕様書

## 1. 共通仕様

### 1.1 ベースURL

`/api`

例: `http://localhost:8000/api`

### 1.2 認証方式

今回の TechInsight ではユーザー認証・認可を対象外とする。全APIは認証なしで利用できる前提とする。

### 1.3 共通ヘッダー

| ヘッダー | 必須 | 値 | 説明 |
|---|---|---|---|
| Content-Type | POST/PUTでYES | `application/json` | リクエスト本文の形式 |
| Accept | NO | `application/json` | JSONレスポンスを要求する |

### 1.4 エラーレスポンス形式

```json
{
  "detail": "エラーメッセージ"
}
```

バリデーションエラーで項目単位の情報を返す場合は、`detail` に配列を含める。

```json
{
  "detail": [
    {
      "field": "title",
      "message": "タイトルは必須です"
    }
  ]
}
```

### 1.5 ページネーション

一覧系APIは `page` と `limit` を受け取り、`items`、`page`、`limit`、`total` を返す。

```json
{
  "items": [],
  "page": 1,
  "limit": 12,
  "total": 1000
}
```

### 1.6 ステータスコード一覧

| コード | 意味 | 使用場面 |
|---|---|---|
| 200 | OK | 取得、更新、削除成功 |
| 201 | Created | 記事作成、ジョブ作成成功 |
| 400 | Bad Request | 不正なクエリパラメータ |
| 404 | Not Found | 指定リソースが存在しない |
| 422 | Unprocessable Entity | 入力バリデーションエラー |
| 500 | Internal Server Error | サーバー内部エラー |

## 2. 認証API

本システムでは認証機能を実装しないため、認証APIは提供しない。

### POST /api/auth/login

対象外。

### POST /api/auth/logout

対象外。

### GET /api/auth/status

対象外。

## 3. 記事 API

### GET /api/articles

- **説明**: 記事一覧を取得する。検索語と検索モードを指定した場合は、同じリソース一覧APIで検索結果を返す。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 値の例 | 概要 | 値の変更による画面変化 |
|---|---|---|---|---|---|---|
| page | integer | NO | `1` | `1`, `2` | 取得するページ番号 | 記事カードのページが切り替わる |
| limit | integer | NO | `12` | `12`, `24` | 1ページあたりの件数 | 1画面に表示されるカード数と総ページ数が変わる |
| q | string | NO | なし | `PostgreSQL`, `APIの応答が遅い原因を調べたい` | 検索語。keywordでは語句一致、semanticでは自然言語クエリとして扱う | 未指定なら初期一覧、指定時は検索結果表示になる |
| searchMode | string | NO | `keyword` | `keyword`, `semantic`, `hybrid` | 検索方式 | `keyword` は語句一致、`semantic` は類似度順、`hybrid` は複合順位になり、スコア表示が変わる |
| categoryId | integer | NO | なし | `1`, `2` | カテゴリ絞り込み | 指定カテゴリの記事だけ表示される |
| authorId | integer | NO | なし | `1`, `3` | 著者絞り込み | 指定著者の記事だけ表示される |
| sort | string | NO | `publishedAt` | `publishedAt`, `title` | 並び替え対象 | 記事カードの並び順が指定項目基準に変わる |
| order | string | NO | `desc` | `desc`, `asc` | 昇順/降順 | 公開日時やタイトルの昇順/降順が切り替わる |

- **レスポンス**:

```json
{
  "items": [
    {
      "id": 1,
      "sourceArticleId": 1,
      "title": "Implementing PostgreSQL: Database schema design and query optimization",
      "snippet": "In this article, we will focus on implementing PostgreSQL...",
      "category": {
        "id": 1,
        "name": "Backend"
      },
      "author": {
        "id": 1,
        "name": "Ito"
      },
      "publishedAt": "2025-09-19T22:00:00+09:00",
      "score": 0.92
    }
  ],
  "page": 1,
  "limit": 12,
  "total": 1000
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 400 | `page`、`limit`、`searchMode`、`sort`、`order` が不正 | 検索条件エラーを表示する |
| 500 | 一覧取得または検索処理に失敗 | 一覧領域にエラーを表示する |

### POST /api/articles

- **説明**: 記事を作成する。作成時に検索用 embedding を生成する。
- **クエリパラメータ**: なし
- **リクエスト本文**:

```json
{
  "title": "Building FastAPI: Async request handling patterns",
  "content": "In this article, we will focus on building FastAPI...",
  "authorName": "Tanaka",
  "categoryName": "Backend",
  "publishedAt": "2026-06-25T10:00:00+09:00"
}
```

- **レスポンス**:

```json
{
  "id": 1001,
  "sourceArticleId": null,
  "title": "Building FastAPI: Async request handling patterns",
  "content": "In this article, we will focus on building FastAPI...",
  "category": {
    "id": 1,
    "name": "Backend"
  },
  "author": {
    "id": 2,
    "name": "Tanaka"
  },
  "publishedAt": "2026-06-25T10:00:00+09:00"
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 422 | 必須項目未入力、タイトル長超過、日時不正 | 作成モーダルの項目単位でエラーを表示する |
| 500 | 保存またはembedding生成に失敗 | 作成モーダル上部にエラーを表示する |

### GET /api/articles/{articleId}

- **説明**: 指定記事の詳細を取得する。
- **クエリパラメータ**: なし
- **レスポンス**:

```json
{
  "id": 1,
  "sourceArticleId": 1,
  "title": "Implementing PostgreSQL: Database schema design and query optimization",
  "content": "In this article, we will focus on implementing PostgreSQL...",
  "category": {
    "id": 1,
    "name": "Backend"
  },
  "author": {
    "id": 1,
    "name": "Ito"
  },
  "publishedAt": "2025-09-19T22:00:00+09:00"
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 404 | 指定記事が存在しない | 詳細モーダルに対象なしを表示し、一覧へ戻す |
| 500 | 詳細取得に失敗 | 詳細モーダル内にエラーを表示する |

### PUT /api/articles/{articleId}

- **説明**: 指定記事を更新する。タイトルまたは本文が変わった場合は embedding を再生成する。
- **クエリパラメータ**: なし
- **リクエスト本文**:

```json
{
  "title": "Optimizing PostgreSQL: Advanced indexing strategies",
  "content": "Updated article content...",
  "authorName": "Nakamura",
  "categoryName": "Backend",
  "publishedAt": "2026-06-25T10:00:00+09:00"
}
```

- **レスポンス**:

```json
{
  "id": 1,
  "sourceArticleId": 1,
  "title": "Optimizing PostgreSQL: Advanced indexing strategies",
  "content": "Updated article content...",
  "category": {
    "id": 1,
    "name": "Backend"
  },
  "author": {
    "id": 4,
    "name": "Nakamura"
  },
  "publishedAt": "2026-06-25T10:00:00+09:00"
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 404 | 指定記事が存在しない | 編集モーダルに対象なしを表示する |
| 422 | 必須項目未入力、タイトル長超過、日時不正 | 編集モーダルの項目単位でエラーを表示する |
| 500 | 更新またはembedding再生成に失敗 | 編集モーダル上部にエラーを表示する |

### DELETE /api/articles/{articleId}

- **説明**: 指定記事を物理削除する。
- **クエリパラメータ**: なし
- **レスポンス**:

```json
{
  "id": 1,
  "deleted": true
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 404 | 指定記事が存在しない | 削除確認ダイアログに対象なしを表示し、一覧を再読み込みする |
| 500 | 削除に失敗 | 削除確認ダイアログ内にエラーを表示する |

### GET /api/articles/{articleId}/related-articles

- **説明**: 指定記事に意味的に近い関連記事を取得する。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 値の例 | 概要 | 値の変更による画面変化 |
|---|---|---|---|---|---|---|
| limit | integer | NO | `3` | `3`, `5` | 関連記事の最大取得件数 | 詳細モーダル内の関連記事カード数が増減する |

- **レスポンス**:

```json
{
  "items": [
    {
      "id": 24,
      "sourceArticleId": 24,
      "title": "Deploying FastAPI: Distributed caching strategies for high traffic",
      "snippet": "In this article, we will focus on deploying FastAPI...",
      "category": {
        "id": 1,
        "name": "Backend"
      },
      "author": {
        "id": 5,
        "name": "Yamamoto"
      },
      "publishedAt": "2024-04-30T04:00:00+09:00",
      "score": 0.87
    }
  ]
}
```

- **エラーケース**:

| ステータス | 条件 | 画面表示 |
|---|---|---|
| 400 | `limit` が不正 | 関連記事領域に条件エラーを表示する |
| 404 | 指定記事が存在しない | 詳細モーダルに対象なしを表示する |
| 500 | 関連記事取得に失敗 | 本文表示は維持し、関連記事領域だけエラー表示にする |

## 4. マスタ・管理API

本システムではダッシュボード画面およびダッシュボード向けAPIを提供しない。記事一覧・検索画面を構成するために必要なマスタAPIと、追加実装扱いの管理APIを本章に記載する。

### GET /api/categories

- **説明**: カテゴリ一覧を取得する。記事作成・編集フォームの選択肢に利用する。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 値の例 | 概要 | 値の変更による画面変化 |
|---|---|---|---|---|---|---|
| q | string | NO | なし | `Back`, `AI` | カテゴリ名の候補検索 | カテゴリセレクトの候補が入力語で絞り込まれる |

- **レスポンス**:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Backend"
    },
    {
      "id": 4,
      "name": "AI/ML"
    }
  ]
}
```

### GET /api/authors

- **説明**: 著者一覧を取得する。記事作成・編集フォームの候補に利用する。
- **クエリパラメータ**:

| パラメータ | 型 | 必須 | デフォルト | 値の例 | 概要 | 値の変更による画面変化 |
|---|---|---|---|---|---|---|
| q | string | NO | なし | `Ito`, `Tan` | 著者名の候補検索 | 著者セレクトまたは入力補完の候補が絞り込まれる |

- **レスポンス**:

```json
{
  "items": [
    {
      "id": 1,
      "name": "Ito"
    },
    {
      "id": 2,
      "name": "Tanaka"
    }
  ]
}
```

### POST /api/reindex-jobs

- **説明**: embedding または検索indexの再生成ジョブを作成する。追加実装扱いとする。
- **クエリパラメータ**: なし
- **リクエスト本文**:

```json
{
  "articleId": 1
}
```

`articleId` を省略した場合は全記事を対象にする。

- **レスポンス**:

```json
{
  "id": "job_20260625_0001",
  "status": "queued",
  "targetCount": 1,
  "processedCount": 0,
  "failedCount": 0
}
```

### GET /api/reindex-jobs/{jobId}

- **説明**: 再インデックスジョブの状態を取得する。追加実装扱いとする。
- **クエリパラメータ**: なし
- **レスポンス**:

```json
{
  "id": "job_20260625_0001",
  "status": "running",
  "targetCount": 1000,
  "processedCount": 240,
  "failedCount": 0
}
```
