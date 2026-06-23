import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/index';
import { setUser, clearUser } from '@/store/slices/authSlice';
import { authApi } from '@/entities/auth';
import { useCurrentUser } from '@/features/auth/get-current-user';
import { ENABLE_AUTH } from '@/shared/config/auth';

/**
 * 認証状態を復元するフック
 *
 * 1. authApi.getAuthStatus() で認証確認（user_id 取得）
 * 2. useCurrentUser() (React Query) で /users/me からユーザー詳細を取得
 * 3. Redux store に反映
 */
export function useAuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Step 1: 認証確認
  useEffect(() => {
    if (!ENABLE_AUTH) {
      dispatch(setUser({ id: 0 }));
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await authApi.getAuthStatus();
        if (response.is_authenticated && response.user_id) {
          setIsAuthenticated(true);
        } else {
          dispatch(clearUser());
        }
      } catch {
        dispatch(clearUser());
      }
    };

    checkAuth();
  }, [dispatch]);

  // Step 2: 認証済みならユーザー詳細を取得
  const {
    data: user,
    isSuccess,
    isError,
  } = useCurrentUser(ENABLE_AUTH && isAuthenticated);

  useEffect(() => {
    if (isSuccess && user) {
      dispatch(
        setUser({
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        }),
      );
    }

    if (isError) {
      dispatch(clearUser());
    }
  }, [dispatch, user, isSuccess, isError]);
}
