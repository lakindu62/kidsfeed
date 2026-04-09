import { CalendarDays, LayoutGrid, UtensilsCrossed } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const MENU_MANAGEMENT_SIDEBAR_CONFIG = {
  brandTitle: 'KIDFEED',
  featureLabel: 'MENU MANAGEMENT',
  sections: [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/menu-management',
          icon: LayoutGrid,
        },
        {
          key: 'menus',
          label: 'Menus',
          to: '/menu-management/menus',
          icon: UtensilsCrossed,
        },
        {
          key: 'calendar',
          label: 'Publishing Calendar',
          to: '/menu-management/calendar',
          icon: CalendarDays,
        },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
