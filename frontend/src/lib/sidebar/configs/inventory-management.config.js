import { LayoutGrid, LogOut, Package } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const INVENTORY_MANAGEMENT_SIDEBAR_CONFIG = {
  brandTitle: 'Kidsfeed',
  featureLabel: 'INVENTORY PORTAL',
  sections: [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/inventory',
          icon: LayoutGrid,
        },
        {
          key: 'inventory',
          label: 'Inventory',
          to: '/inventory/items',
          icon: Package,
        },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
