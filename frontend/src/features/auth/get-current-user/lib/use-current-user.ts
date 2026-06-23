'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi, type UserResponse } from '@/entities/user';

/**
 * ログイン中ユーザーの情報を取得する useQuery フック
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useCurrentUser();
 * // user?.name, user?.email でユーザー情報にアクセス
 * ```
 */
export function useCurrentUser(enabled = true) {
  return useQuery<UserResponse>({
    queryKey: ['user', 'me'],
    queryFn: () => userApi.getMe(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5分
    retry: false,
  });
}
