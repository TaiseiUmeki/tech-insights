'use client';

import { QueryProvider } from '@/app/provider/QueryProvider';
import { Toaster } from '@/shared/ui/shadcn/ui/sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NuqsAdapter>
        {children}
        <Toaster />
      </NuqsAdapter>
    </QueryProvider>
  );
}
