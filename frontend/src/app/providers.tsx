'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/index';
import { QueryProvider } from '@/app/provider/QueryProvider';
import { useAuthInitializer } from '@/features/auth/auth-initializer';
import { Toaster } from '@/shared/ui/shadcn/ui/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

/**
 * 認証状態を復元するコンポーネント
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuthInitializer();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryProvider>
        <NuqsAdapter>
          <AuthInitializer>{children}</AuthInitializer>
          <Toaster />
        </NuqsAdapter>
      </QueryProvider>
    </Provider>
  );
}
