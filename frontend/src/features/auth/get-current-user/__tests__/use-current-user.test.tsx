import { renderHook, waitFor } from '@/__tests__/testing-utils';
import { server } from '@/__tests__/mocks/server';
import { createGetMeErrorHandler } from '@/__tests__/mocks/handlers';
import { TestProviders } from '@/__tests__/testing-utils';
import { useCurrentUser } from '../lib/use-current-user';

describe('useCurrentUser', () => {
  it('ユーザー情報を正常に取得できる', async () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      id: 1,
      login_id: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
    });
  });

  it('未認証の場合エラー状態になる', async () => {
    server.use(createGetMeErrorHandler(401));

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('enabled=false の場合クエリを実行しない', () => {
    const { result } = renderHook(() => useCurrentUser(false), {
      wrapper: ({ children }) => <TestProviders>{children}</TestProviders>,
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
