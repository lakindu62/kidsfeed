import {
  ClipboardCheck,
  FileText,
  LayoutGrid,
  Megaphone,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { DEFAULT_FOOTER_ACTIONS } from './defaults';

export const MEAL_DISTRIBUTION_SIDEBAR_CONFIG = {
  brandTitle: 'Kidsfeed',
  featureLabel: 'MEAL DISTRIBUTION PORTAL',
  sections: [
    {
      key: 'main',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          to: '/meal-distribution',
          icon: LayoutGrid,
        },
        {
          key: 'sessions',
          label: 'Meal Sessions',
          to: '/meal-distribution/sessions',
          icon: UtensilsCrossed,
        },
        {
          key: 'attendance',
          label: 'Mark Attendance',
          to: '/meal-distribution/attendance',
          icon: ClipboardCheck,
        },
        {
          key: 'no-show-alerts',
          label: 'No-Show Alerts',
          to: '/meal-distribution/no-show-alerts',
          icon: Megaphone,
        },
        {
          key: 'student-history',
          label: 'Student History',
          to: '/meal-distribution/student-history',
          icon: Users,
        },
        {
          key: 'reports',
          label: 'Reports',
          to: '/meal-distribution/reports',
          icon: FileText,
        },
      ],
    },
  ],
  footerActions: DEFAULT_FOOTER_ACTIONS,
};
