'use client';

import { ShowcaseSection } from '../ShowcaseSection';
import { SidebarProvider } from '@/shared/ui/shadcn/ui/sidebar';
import { AppSidebar } from '@/widgets/sidebar';

export function NavigationShowcase() {
  return (
    <ShowcaseSection
      id='app-sidebar'
      title='AppSidebar'
      filePath='src/widgets/sidebar/ui/AppSidebar.tsx'
      usages={['src/app/(authenticated)/AuthenticatedLayoutClient.tsx']}
    >
      <div className='relative h-[500px] overflow-hidden rounded-md border'>
        <SidebarProvider
          defaultOpen={true}
          style={
            {
              '--sidebar-width': '240px',
              '--sidebar-width-icon': '64px',
            } as React.CSSProperties
          }
        >
          <AppSidebar />
          <div className='flex-1 bg-gray-50 p-6'>
            <p className='text-sm text-muted-foreground'>
              メインコンテンツ領域
            </p>
          </div>
        </SidebarProvider>
      </div>
    </ShowcaseSection>
  );
}
