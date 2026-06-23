'use client';

import { SidebarInset, SidebarProvider } from '@/shared/ui/shadcn/ui/sidebar';
import { AppSidebar } from '@/widgets/sidebar';
import { UnsavedChangesDialog } from '@/features/unsaved-change';

export function AuthenticatedLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '240px',
          '--sidebar-width-icon': '64px',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className='flex h-screen flex-col overflow-hidden'>
        {children}
      </SidebarInset>
      <UnsavedChangesDialog />
    </SidebarProvider>
  );
}
