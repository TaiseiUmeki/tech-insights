import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * ユーザーAPI のデフォルトハンドラー（成功レスポンス）
 */
export const userHandlers = [
  // GET /users/me（ログイン中ユーザー情報取得）
  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json({
      id: 1,
      login_id: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
    });
  }),
];

/**
 * エラーレスポンス用のハンドラー生成関数
 */
export const createGetMeErrorHandler = (status: number = 401) =>
  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json({ detail: 'Unauthorized' }, { status });
  });
