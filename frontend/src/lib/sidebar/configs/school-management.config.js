import { FileText, LayoutGrid, School } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const SCHOOL_MANAGEMENT_SIDEBAR_CONFIG = {
  brandTitle: 'KIDFEED',
  featureLabel: 'SCHOOL MANAGEMENT',
  sections: [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/school-management',
          icon: LayoutGrid,
        },
        {
          key: 'schools',
          label: 'Schools',
          to: '/school-management/schools',
          icon: School,
        },
        {
          key: 'reports',
          label: 'Reports',
          to: '/school-management/reports',
          icon: FileText,
        },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
