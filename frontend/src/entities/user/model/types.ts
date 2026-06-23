// ユーザーレスポンス (バックエンド: GET /users/me, GET /users/:id)
export interface UserResponse {
  id: number;
  login_id: string;
  email: string | null;
  name: string | null;
}
