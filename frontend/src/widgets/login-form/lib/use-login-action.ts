'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '@/features/auth/login';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { handleMutationError } from '@/shared/lib/api-error-handler';

export function useLoginAction() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  return useLogin({
    onSuccess: (data) => {
      dispatch(setUser({ id: data.user_id }));
      router.push('/dashboard');
    },
    onError: (error) => {
      handleMutationError(error, 'ログイン');
    },
  });
}
