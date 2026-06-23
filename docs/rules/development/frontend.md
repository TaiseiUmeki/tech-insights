---
paths: frontend/**
---
# フロントエンド開発ガイド

## 目次

1. [はじめに](#はじめに)
2. [開発フロー](#開発フロー)
3. [FSD レイヤーの使い方](#fsd-レイヤーの使い方)
4. [API 連携](#api-連携)
5. [状態管理](#状態管理)
6. [フォーム実装](#フォーム実装)
7. [UI コンポーネント](#ui-コンポーネント)
8. [コーディング規約](#コーディング規約)

---

## はじめに

このガイドでは、AI Solution Template を使った実践的な開発方法を説明します。

### 前提条件

- フロントエンドアーキテクチャガイドの FSD アーキテクチャを理解していること
- フロントエンドの環境構築が完了していること
- React、TypeScript、Next.js の基本知識があること

---

## 開発フロー

新機能を追加する際の基本的なフロー:

### 1. 型定義 & API クライアント（Entities レイヤー）

```
entities/[domain]/
  ├── model/types.ts    # 型定義
  └── api/[domain]-api.ts  # API 呼び出し
```

**作業内容:**

- ドメインモデルの型を定義する
- HTTP クライアントを使って API 関数を実装する

### 2. ビジネスロジック（Features レイヤー）

```
features/[domain]/[use-case]/
  ├── model/types.ts    # フォームデータ型など
  └── lib/use-[name].ts # カスタム Hook
```

**作業内容:**

- React Query の useQuery や useMutation を使って Hook を作成する
- Entities の API を呼び出す

### 3. UI コンポーネント（Widgets レイヤー - 任意）

```
widgets/[domain]/[name]-widget/
  └── ui/[Name]Widget.tsx
```

**作業内容:**

- 複数の Features を組み合わせた再利用可能なコンポーネント
- シンプルなページでは不要

### 4. ページ構成（Page-Components レイヤー）

```
page-components/[page-name]/
  └── ui/[PageName]Page.tsx
```

**作業内容:**

- Widgets を配置してページ全体を構成する
- ページ固有のレイアウト

### 5. ルーティング（App レイヤー）

```
app/(authenticated)/[page-name]/
  └── page.tsx
```

**作業内容:**

- Page-Component をインポートして表示するだけ

---

### 実装例

| タスク | 配置場所 |
| --- | --- |
| ユーザー一覧 API | `entities/user/api/user-api.ts` |
| ユーザー検索 Hook | `features/user/search-users/lib/use-search-users.ts` |
| ログインフォーム | `widgets/auth/login-form/ui/LoginForm.tsx` |
| ログインページ | `page-components/login/ui/LoginPage.tsx` |
| 日付フォーマット関数 | `shared/utils/format/date.ts` |
| ボタンコンポーネント | `shared/ui/shadcn/button.tsx` |

---

## API 連携

### HTTP クライアントの基本

**配置場所:** `shared/api/client/http-client.ts`（設定済み）

```typescript
import httpClient from "@/shared/api/client/http-client";

// GET
const response = await httpClient.get<User>("/api/users/123");

// POST
const response = await httpClient.post<User>("/api/users", data);

// PUT
const response = await httpClient.put<User>("/api/users/123", data);

// DELETE
await httpClient.delete("/api/users/123");
```

### React Query との統合

#### データ取得（useQuery）

```typescript
// features/user/get-user/lib/use-user.ts
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/user-api";

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userApi.getById(userId),
    staleTime: 1000 * 60 * 5, // 5分キャッシュ
  });
}
```

#### データ更新（useMutation）

```typescript
// features/user/update-user/lib/use-update-user.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/entities/user/api/user-api";

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userApi.update(data),
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

---

## 状態管理

### 2つの状態管理アプローチ

| 状態の種類 | ライブラリ | 例 |
| --- | --- | --- |
| **グローバル状態**（アプリ全体） | Redux Toolkit | 認証状態、ユーザー情報、テーマ |
| **サーバー状態**（API から取得） | React Query | ユーザー一覧、投稿データ、検索結果 |

## フォーム実装

### React Hook Form + Zod

### ポイント

- Zod でバリデーションを定義（型は自動生成）
- エラーメッセージは日本語で記述
- `isSubmitting` で二重送信を防止

---

## UI コンポーネント

### shadcn/ui の利用

**現在利用可能なコンポーネント:**

- Button, Card, Input, Label

**新しいコンポーネントの追加:**

```bash
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
```

コンポーネントは `shared/ui/shadcn/` に自動的に追加されます。

### カスタムコンポーネント

プロジェクト固有の UI コンポーネントは `shared/ui/components/` に配置してください。

---

## コーディング規約

### 命名規則

| 対象 | 規則 | 例 |
| --- | --- | --- |
| コンポーネント | PascalCase | `LoginPage.tsx` |
| Hooks | camelCase + use プレフィックス | `useLogin.ts` |
| 関数 | camelCase | `formatDate.ts` |
| 定数 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 型 | PascalCase | `User`, `LoginFormData` |

### FSD 依存関係ルール

```typescript
// NG: Shared レイヤーから上位レイヤーをインポート
import { useLogin } from "@/features/auth/login/lib/use-login"; // NG

// OK: 下位から上位への参照のみ
import httpClient from "@/shared/api/client/http-client"; // OK
```

> 注意: バレルファイル（index.ts）は使用しません。コンパイル速度向上のため、ファイルパスで直接インポートしてください。

**ESLint で自動チェックされます!**

### TypeScript スタイル

```typescript
// 推奨: type を優先
export type User = { id: string; name: string };

// 推奨: 明示的な戻り値の型
export function getUser(id: string): Promise<User> { ... }

// 非推奨: any の使用
function process(data: any) { ... }

// 推奨: unknown を使用
function process(data: unknown) {
  if (typeof data === 'object') { ... }
}
```

## 参考資料

- フロントエンドアーキテクチャガイド - アーキテクチャの詳細
- テストガイド - テストについて
- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
