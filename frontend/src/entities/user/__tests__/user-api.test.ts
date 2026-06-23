import { server } from '@/__tests__/mocks/server';
import { createGetMeErrorHandler } from '@/__tests__/mocks/handlers';
import { userApi } from '../api/user-api';

describe('userApi', () => {
  describe('getMe', () => {
    it('ログイン中ユーザーの情報を取得できる', async () => {
      const result = await userApi.getMe();

      expect(result).toEqual({
        id: 1,
        login_id: 'admin',
        email: 'admin@example.com',
        name: 'Admin User',
      });
    });

    it('未認証の場合エラーをスローする', async () => {
      server.use(createGetMeErrorHandler(401));

      await expect(userApi.getMe()).rejects.toThrow();
    });

    it('サーバーエラーの場合エラーをスローする', async () => {
      server.use(createGetMeErrorHandler(500));

      await expect(userApi.getMe()).rejects.toThrow();
    });
  });
});
