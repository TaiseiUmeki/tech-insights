'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from '@/shared/ui/shadcn/ui/sidebar';
import { Avatar, AvatarFallback } from '@/shared/ui/shadcn/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/ui/dropdown-menu';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/authSlice';
import { useLogout } from '@/features/auth/logout';
import { handleMutationError } from '@/shared/lib/api-error-handler';
import { ENABLE_AUTH } from '@/shared/config/auth';

import { menuGroups } from '../lib/menu-items';

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const logoutMutation = useLogout({
    onSuccess: () => {
      dispatch(clearUser());
      router.push('/login');
    },
    onError: (error) => {
      handleMutationError(error, 'ログアウト');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const displayName = user?.name || user?.email || `ID: ${user?.id}`;

  return (
    <Sidebar
      collapsible='icon'
      className='overflow-x-hidden border-r-0 bg-primary text-primary-foreground'
    >
      {/* Header: App Name */}
      <SidebarHeader className='border-b border-primary-foreground/20'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size='lg'
              onClick={toggleSidebar}
              tooltip='メニューを開く'
              className='text-primary-foreground hover:bg-primary-foreground/10'
            >
              <div className='flex size-8 items-center justify-center rounded-lg bg-primary-foreground/20 text-sm font-bold'>
                A
              </div>
              <div className='grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden'>
                <span className='truncate text-lg font-semibold text-primary-foreground'>
                  App Name
                </span>
              </div>
              <span className='group-data-[collapsible=icon]:hidden'>
                {isCollapsed ? (
                  <PanelLeftOpen className='ml-auto size-5 text-primary-foreground/70' />
                ) : (
                  <PanelLeftClose className='ml-auto size-5 text-primary-foreground/70' />
                )}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content: Menu Groups */}
      <SidebarContent className='overflow-x-hidden'>
        {menuGroups.map((group, index) => (
          <div key={group.label}>
            {index > 0 && (
              <SidebarSeparator className='bg-primary-foreground/20' />
            )}
            <SidebarGroup>
              <SidebarGroupLabel className='h-8 text-sm text-primary-foreground/70 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:opacity-100'>
                <span className='group-data-[collapsible=icon]:hidden'>
                  {group.label}
                </span>
                {group.shortLabel && (
                  <span className='hidden text-xs group-data-[collapsible=icon]:inline'>
                    {group.shortLabel}
                  </span>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      pathname?.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className='text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground data-[active=true]:bg-primary-foreground/20 data-[active=true]:text-primary-foreground'
                        >
                          <Link
                            href={item.url}
                            className='flex items-center gap-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center'
                          >
                            <item.icon className='shrink-0' />
                            <span className='group-data-[collapsible=icon]:hidden'>
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      {/* Footer: User Info & Logout */}
      <SidebarFooter className='border-t border-primary-foreground/20'>
        <SidebarMenu>
          <SidebarMenuItem>
            {ENABLE_AUTH ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size='lg'
                    className='text-primary-foreground hover:bg-primary-foreground/10 data-[state=open]:bg-primary-foreground/10'
                  >
                    <Avatar className='size-10 shrink-0 rounded-lg'>
                      <AvatarFallback className='rounded-lg bg-primary-foreground/30 text-primary-foreground'>
                        <User className='size-5' />
                      </AvatarFallback>
                    </Avatar>
                    <span className='truncate text-base font-semibold text-primary-foreground group-data-[collapsible=icon]:hidden'>
                      {displayName}
                    </span>
                    <ChevronUp className='ml-auto size-5 text-primary-foreground/70 group-data-[collapsible=icon]:hidden' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                  side='top'
                  align='start'
                  sideOffset={4}
                >
                  <div className='flex items-center gap-3 px-2 py-2'>
                    <Avatar className='size-10 rounded-lg'>
                      <AvatarFallback className='rounded-lg bg-primary/30 text-primary-foreground'>
                        <User className='size-5 text-primary' />
                      </AvatarFallback>
                    </Avatar>
                    <span className='truncate text-base font-semibold'>
                      {displayName}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className='text-base text-destructive focus:text-destructive'
                  >
                    <LogOut className='mr-2 size-5' />
                    {logoutMutation.isPending
                      ? 'ログアウト中...'
                      : 'ログアウト'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size='lg'
                className='cursor-default text-primary-foreground'
              >
                <Avatar className='size-10 shrink-0 rounded-lg'>
                  <AvatarFallback className='rounded-lg bg-primary-foreground/30 text-primary-foreground'>
                    <User className='size-5' />
                  </AvatarFallback>
                </Avatar>
                <span className='truncate text-base font-semibold text-primary-foreground group-data-[collapsible=icon]:hidden'>
                  ゲスト
                </span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className='bg-primary-foreground/10 hover:bg-primary-foreground/20' />
    </Sidebar>
  );
}
