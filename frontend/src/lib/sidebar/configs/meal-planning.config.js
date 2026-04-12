import { CalendarDays, FileText, LayoutGrid } from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const MEAL_PLANNING_SIDEBAR_CONFIG = {
  brandTitle: 'KIDFEED',
  featureLabel: 'MEAL PLANNING',
  sections: [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/meal-planning',
          icon: LayoutGrid,
        },
        {
          key: 'plans',
          label: 'Weekly Plans',
          to: '/meal-planning/plans',
          icon: CalendarDays,
        },
        {
          key: 'reports',
          label: 'Reports',
          to: '/meal-planning/reports',
          icon: FileText,
        },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
