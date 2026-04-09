import { LayoutGrid, LogOut, Package, Settings } from 'lucide-react';

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
        {
          key: 'settings',
          label: 'Settings',
          to: '/inventory/settings',
          icon: Settings,
        },
      ],
    },
  ],
  primaryCta: {
    key: 'new-stock',
    label: 'Add New Stock',
    to: '/inventory/new-stock',
  },
  footerActions: [{ key: 'logout', label: 'Logout', icon: LogOut }],
};
