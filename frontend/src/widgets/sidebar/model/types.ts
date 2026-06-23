import type { LucideIcon } from 'lucide-react';

export type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type MenuGroup = {
  label: string;
  shortLabel?: string;
  items: MenuItem[];
};
