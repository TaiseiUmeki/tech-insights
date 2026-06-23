---
paths: frontend/**
---
# フロントエンドアーキテクチャガイド

## 目次

1. [技術スタック](#技術スタック)
2. [FSD アーキテクチャ](#fsd-アーキテクチャ)
3. [認証設計](#認証設計)
4. [ディレクトリ構成](#ディレクトリ構成)
5. [実装計画](#実装計画)

---

## 技術スタック

### コアフレームワーク

- **Next.js 15.3.2** (App Router)
- **React 19.2.0**
- **TypeScript 5.4.5**

### UI ライブラリ

- **shadcn/ui** - 再利用可能なコンポーネントライブラリ
  - Radix UI 2.x ベース
  - class-variance-authority 0.7.0
- **Tailwind CSS 3.4.3** - ユーティリティファーストの CSS フレームワーク
  - tailwindcss-animate 1.0.7

### 状態管理

- **Redux Toolkit 2.2.0** - グローバル状態管理（認証状態、ユーザー情報）
- **TanStack React Query 5.28.0** - サーバー状態管理、キャッシング
  - React Query Devtools 統合

### フォーム管理

- **React Hook Form 7.51.0** - 高パフォーマンスなフォーム管理
- **Zod 3.22.4** - TypeScript 型安全なバリデーション
- **@hookform/resolvers 3.3.4** - Zod 連携

### HTTP 通信

- **Axios 1.6.8** - HTTP クライアント
  - インターセプター実装（エラーハンドリング、認証エラー処理）
  - Cookie ベースの認証サポート（withCredentials: true）
  - React Query 連携

### テスト

- **Jest 29.7.0** - テストフレームワーク

### コード品質

- **ESLint 8.57.0** - 静的解析
  - Next.js 設定（eslint-config-next 15.3.2）
  - TypeScript ESLint 7.18.0
  - eslint-plugin-boundaries 4.2.2（FSD レイヤー依存チェック）
  - Prettier 連携
- **Prettier 3.2.5** - コードフォーマッター
  - prettier-plugin-tailwindcss 0.6.9

### インフラストラクチャ

- **Docker** - コンテナ化（Dockerfile 実装済み）
- **Docker Compose** - 開発環境構築
- **GitHub Actions** - CI/CD（frontend-ci.yml 実装済み）

---

## FSD アーキテクチャ

### FSD（Feature-Sliced Design）とは

フロントエンドアプリケーションを階層的に整理するアーキテクチャパターン。機能をビジネスドメインごとに分割し、各レイヤーに明確な責務を持たせることで、保守性と拡張性を向上させる。

### レイヤー階層

```
Top Layer  -> App (Routing, page composition)
              ↓
            Page-Components (Page components)
              ↓
            Widgets (Reusable widgets)
              ↓
            Features (Use cases, business logic)
              ↓
            Entities (Domain models, API communication)
              ↓
Bottom     -> Shared (Shared components, utilities)
```

### 依存ルール

**方向**: 上位レイヤーから下位レイヤーへのみ。同じレイヤー内の異なるセグメント間でインポートしてはならない。

| Layer               | Can import                          | Cannot import                           |
| ------------------- | ----------------------------------- | --------------------------------------- |
| **Shared**          | Shared                              | Everything                              |
| **Entities**        | Shared                              | Features, Widgets, Page-Components, App |
| **Features**        | Entities, Shared                    | Widgets, Page-Components, App           |
| **Widgets**         | Features, Entities, Shared          | Page-Components, App                    |
| **Page-Components** | Widgets, Features, Entities, Shared | App                                     |
| **App**             | Everything (top level)              | -                                       |

### 主な制約

- 各レイヤーは下位レイヤーからのみインポート可能
- UI コンポーネントとロジックを適切に分離する
- 下位レイヤーは上位レイヤーをインポートしてはならない
- 同一レイヤー内での循環依存を避ける

### index.ts 戦略

コンパイルパフォーマンスとツリーシェイキングを考慮し、`index.ts` の配置には以下の方針に従う。

#### 基本方針

| Policy | Description |
| --- | --- |
| **スライスごとに配置** | 各機能スライスのルートに配置する（user-master、auth など） |
| **レイヤーレベルの index は作らない** | `entities/index.ts` のような大規模な再エクスポートを避ける |
| **パブリック API のみエクスポート** | 内部実装を隠蔽し、外部に必要なもののみ公開する |

#### レイヤーごとのルール

```
# Good: スライスごと
import { UserMasterContainer } from '@/page-components/user-master';
import { useLogin } from '@/features/auth/login';
import { authApi } from '@/entities/auth';
import { FilterBar } from '@/widgets/filter-bar';

# Bad: レイヤーレベルの一括再エクスポート
import { UserMasterContainer, ItemMasterContainer, ... } from '@/page-components';
import { authApi, userApi, itemApi, ... } from '@/entities';
```

#### レイヤーごとの index.ts 配置場所

| Layer | index.ts location | Example |
| --- | --- | --- |
| page-components | Under each slice | `page-components/user-master/index.ts` |
| widgets | Under each widget | `widgets/filter-bar/index.ts` |
| features | Under each feature | `features/auth/login/index.ts` |
| entities | Under each entity | `entities/auth/index.ts` |
| shared | Under each submodule | `shared/lib/index.ts`, `shared/ui/form-fields/index.ts` |

---

## Shared レイヤー

### 役割

アプリケーション全体で共有される汎用的なコード、コンポーネント、ユーティリティ。

### ディレクトリ構成

```
frontend/src/shared/
├── api/                 # Shared API
│   ├── client/          # HTTP client
│   │   └── http-client.ts
│   └── types/           # API type definitions
│       └── index.ts
├── config/              # Shared configuration
│   └── auth.ts          # Auth feature flags (ENABLE_AUTH)
├── lib/                 # Custom hooks & libraries
│   └── api-error-handler.ts
├── types/               # Shared type definitions
│   └── user.ts          # User type (used by store and entities)
├── ui/                  # Shared UI components
│   ├── shadcn/          # shadcn/ui components
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   └── ui/          # button, card, input, sidebar, etc.
│   ├── form-fields/     # Form field components
│   └── components/      # Custom shared components
└── utils/               # Utility functions
    ├── format/
    │   └── date.ts
    └── storage/
        └── storage.ts
```

> **注意**: React Query の QueryProvider は `app/provider/QueryProvider.tsx` に配置しています。

### 含めるもの

- ビジネスロジックを持たないプリミティブな UI コンポーネント
- 汎用的なユーティリティ関数
- データ変換、フォーマット、ストレージ操作
- 複数の機能にまたがって使用される基本的な値オブジェクト

### 含めないもの

- 特定の機能に依存するビジネスロジック -> `features/`
- ページ固有のコンポーネント -> `widgets/` または `page-components/`
- 他のレイヤー（features、widgets、app）への依存

---

## Entities レイヤー

### 役割

ビジネスドメインごとのデータモデル、API 通信、ドメインロジック。

### ディレクトリ構成

```
frontend/src/entities/
├── auth/                        # Auth domain
│   ├── model/                   # Type definitions
│   │   ├── types.ts
│   │   └── user.ts
│   └── api/                     # API client
│       └── auth-api.ts
├── user/                        # User domain
│   ├── model/
│   │   └── types.ts
│   └── api/
│       └── user-api.ts
└── shared/                      # Shared between entities
```

### 含めるもの

- ドメインエンティティの定義
- API レスポンス/リクエストの型定義
- データ変換ロジック（DTO <-> エンティティ）
- 特定エンティティの API 通信ロジック
- HTTP リクエスト/レスポンスのハンドリング
- エラーハンドリング

### 含めないもの

- ページ固有のロジック -> `widgets/` または `page-components/`
- 複数ドメインにまたがる複雑なユースケース -> `features/`
- React Hooks や状態管理 -> `features/`

### 設計のポイント

- DTO とエンティティを明確に分離する
- 変換メソッドを提供する（fromDTO、toDTO）
- Shared レイヤーの httpClient を使用する
- 型安全な API 呼び出し

---

## Features レイヤー

### 役割

ビジネスユースケースの実装、React Hooks、状態管理。

### ディレクトリ構成

```
frontend/src/features/
├── auth/
│   ├── auth-initializer/        # Auth state initialization
│   │   ├── lib/
│   │   │   └── use-auth-initializer.ts
│   │   └── index.ts
│   ├── login/
│   │   ├── model/               # Type definitions
│   │   │   └── types.ts
│   │   ├── lib/                 # Logic & Hooks
│   │   │   └── use-login.ts
│   │   └── index.ts
│   ├── logout/
│   └── get-current-user/
└── shared/                      # Shared logic between features
```

### 含めるもの

- ユースケースの実装（CRUD 操作、検索、集計など）
- ビジネスロジックの調整と組み合わせ
- React Hooks（データ取得、状態管理）
- 複数エンティティにまたがる処理
- バリデーションロジック
- データの変換・加工ロジック

### 含めないもの

- ページ全体のレイアウト -> `page-components/`
- 複雑なウィジェット（複数機能の組み合わせ） -> `widgets/`
- 汎用的なユーティリティ -> `shared/`
- ドメインエンティティの定義 -> `entities/`

### 設計のポイント

- Executor パターンでビジネスロジックをカプセル化する
- React Hooks で UI とロジックを分離する
- エンティティの API クライアントを使用する
- エラーハンドリングと状態管理

---

## Widgets レイヤー

### 役割

複数の Features を組み合わせた再利用可能なウィジェット。

### ディレクトリ構成

```
frontend/src/widgets/
├── login-form/                  # Login form
├── logout-button/               # Logout button
└── sidebar/                     # App sidebar navigation
```

### 含めるもの

- 複数の Features を組み合わせた再利用可能なコンポーネント
- 複数ページで使用される複雑な UI パターン
- Features のロジックを使用する UI コンポーネント

### 含めないもの

- ページ全体のレイアウト -> `page-components/`
- ビジネスロジック単体 -> `features/`
- 汎用的なプリミティブコンポーネント -> `shared/ui`

### 設計のポイント

- **再利用性**: 複数ページで使用可能な設計にする
- **独立性**: 最小限の props で単独動作する
- **Features 統合**: 内部で Features の Hooks を使用する

---

## Page-Components レイヤー

### 役割

ページレベルのコンポーネント。

### ディレクトリ構成

```
frontend/src/page-components/
├── login/
│   ├── ui/
│   │   └── LoginPage.tsx
│   └── index.ts
└── dashboard/
    ├── ui/
    │   └── DashboardPage.tsx
    └── index.ts
```

### 含めるもの

- ページレベルのコンテナコンポーネント
- Widgets を組み合わせたページ構成
- ページ固有のカスタムフック（検索、フィルタリングなど）
- ページ固有の状態管理と Context
- ページ固有の設定ファイル

### 含めないもの

- ルーティング定義 -> `app/`
- 再利用可能な Widgets -> `widgets/`
- ビジネスロジック -> `features/`
- 複数ページにまたがる Context -> `features/`

### 設計のポイント

- Widgets の組み立てに専念する
- カスタムフックでロジックを分離する
- レイアウトと UI の構成に責務を限定する

---

## App レイヤー

### 役割

アプリケーションの最上位レイヤー。ルーティング、ページ構成、グローバル設定。

### ディレクトリ構成

```
frontend/src/app/
├── (authenticated)/              # Routes requiring authentication
│   ├── layout.tsx               # Authenticated layout
│   ├── dashboard/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── (public)/                    # Public routes
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx
├── layout.tsx                   # Root layout
├── globals.css                  # Global styles
└── providers.tsx                # Global providers
```

### 含めるもの

- Page-Components のコンテナコンポーネントの呼び出し（page.tsx）
- 共通レイアウト構造（layout.tsx）
- ルートグループによる論理的なルート分割
- 動的ルート（[id]）
- グローバル Context プロバイダー
- 認証チェックミドルウェア
- グローバルスタイル

### 含めないもの

- ビジネスロジック -> `features/`
- 複雑な UI 構成 -> `page-components/`
- データ取得ロジック -> `features/` または `page-components/`

### 設計のポイント

- **薄く保つ**: page.tsx は Page-Components を呼び出すだけにする
- **ルーティングに専念する**: URL とコンポーネントのマッピング
- **共通レイアウトを活用する**: layout.tsx で階層ごとに定義する

---

## 認証設計

### 認証方式

**Cookie ベースの JWT 認証**

- JWT を httpOnly Cookie に保存
- XSS 攻撃の防止
- CSRF 対策（sameSite 設定）

### Cookie 設定

```typescript
{
  httpOnly: true,           // JavaScript からアクセス不可
  secure: true,             // HTTPS のみ（本番環境）
  sameSite: 'lax',          // CSRF 対策
  path: '/',
  maxAge: 7 * 24 * 60 * 60  // 7日間
}
```

### バックエンド API

| Endpoint           | Method | Description                  |
| ------------------ | ------ | ---------------------------- |
| `/api/auth/login`  | POST   | Login, set Cookie            |
| `/api/auth/logout` | POST   | Logout, delete Cookie        |
| `/api/auth/me`     | GET    | Get current user info        |

### 認証フロー

1. **ログイン**
   - ユーザーがログインフォームで認証情報を送信する
   - バックエンドが検証し、JWT を Cookie にセットする
   - フロントエンドがユーザー情報を Redux に保存する
   - `/dashboard` にリダイレクトする

2. **認証状態チェック**
   - Next.js Middleware が Cookie の存在を確認する
   - 各ページが `/api/auth/me` を呼び出して完全な検証を行う
   - ユーザー情報を Redux store に保存する

3. **ログアウト**
   - `/api/auth/logout` を呼び出す
   - バックエンドが Cookie を削除する
   - Redux store をクリアする
   - `/login` にリダイレクトする

### Next.js Middleware

**役割**: 保護ルートへのアクセス制御

### React Query 連携

- ログイン/ログアウト API を React Query で管理する
- キャッシングとリフェッチのメリットを活用する
- 認証成功時に Redux store を更新する

---

## ディレクトリ構成

### 完全なディレクトリツリー

```
frontend/
├── src/
│   ├── app/                     # App layer
│   │   ├── (authenticated)/     # Authenticated routes
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/
│   │   │       └── page.tsx
│   │   ├── (public)/            # Public routes
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── providers.tsx
│   │   └── middleware.ts
│   ├── page-components/         # Page-Components layer
│   │   ├── login/
│   │   └── dashboard/
│   ├── widgets/                 # Widgets layer
│   │   ├── common/
│   │   └── auth/
│   ├── features/                # Features layer
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── get-current-user/
│   │   └── shared/
│   ├── entities/                # Entities layer
│   │   ├── auth/
│   │   │   ├── model/
│   │   │   └── api/
│   │   └── shared/
│   ├── shared/                  # Shared layer
│   │   ├── api/
│   │   │   ├── client/
│   │   │   └── types/
│   │   ├── lib/
│   │   │   └── react-query/
│   │   ├── types/
│   │   ├── ui/
│   │   │   └── shadcn/
│   │   └── utils/
│   │       ├── format/
│   │       └── storage/
│   └── store/                   # Redux store
│       ├── index.ts
│       └── slices/
│           └── authSlice.ts
├── public/
├── docs/                        # Documentation
├── .env.local.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── Dockerfile
└── .dockerignore
```

---

## 開発ガイドライン

### コーディング規約

1. **TypeScript strict モード有効**
   - 常に `strict: true` を使用する
   - `any` の使用を最小限に抑える

2. **命名規約**
   - コンポーネント: PascalCase (`LoginPage.tsx`)
   - Hooks: camelCase (`useLogin.ts`)
   - 定数: UPPER_SNAKE_CASE (`API_BASE_URL`)
   - ファイル名: kebab-case または PascalCase（統一すること）

3. **インポート順序**

   ```typescript
   // 1. 外部ライブラリ
   import React from "react";
   import { useQuery } from "@tanstack/react-query";

   // 2. 内部モジュール（FSD 順）
   import { LoginPage } from "@/page-components/login";
   import { useLogin } from "@/features/auth/login";
   import { authApi } from "@/entities/auth/api";
   import { Button } from "@/shared/ui/shadcn/button";

   // 3. 型定義
   import type { User } from "@/entities/auth/model";
   ```

4. **FSD 依存チェック**
   - 上位レイヤーから下位レイヤーへのみインポートする
   - 同一レイヤー内の依存を避ける
   - ESLint ルールで自動チェックされる

### コードレビューポイント

- [ ] FSD アーキテクチャに準拠しているか
- [ ] 適切な型定義がされているか
- [ ] エラーハンドリングが実装されているか
- [ ] テストが書かれているか
- [ ] 適切なレイヤーに配置されているか

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
