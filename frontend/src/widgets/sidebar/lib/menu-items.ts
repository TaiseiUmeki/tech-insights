import { LayoutDashboard } from 'lucide-react';
import type { MenuGroup } from '../model/types';

const mainMenuItems: MenuGroup = {
  label: 'Main Menu',
  shortLabel: 'Main',
  items: [
    {
      title: 'ダッシュボード',
      url: '/dashboard',
      icon: LayoutDashboard,
    },
  ],
};

export const menuGroups: MenuGroup[] = [mainMenuItems];
