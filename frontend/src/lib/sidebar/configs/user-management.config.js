import { LayoutGrid, Shield, Users } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const USER_MANAGEMENT_SIDEBAR_CONFIG = {
  brandTitle: 'KIDFEED',
  featureLabel: 'USER MANAGEMENT',
  sections: [
    {
      key: 'main',
      items: [
        // {
        //   key: 'dashboard',
        //   label: 'Dashboard',
        //   to: '/user-management',
        //   icon: LayoutGrid,
        // },
        {
          key: 'users',
          label: 'Users',
          to: '/user-management',
          icon: Users,
        },
        // {
        //   key: 'roles',
        //   label: 'Roles & Permissions',
        //   to: '/user-management/roles',
        //   icon: Shield,
        // },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
