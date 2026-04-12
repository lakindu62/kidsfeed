import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_MENU_CONFIG = {
  brandTitle: 'KIDSFEED',
  featureLabel: 'Menu Management',
  sections: [
    {
      key: 'main',
      items: [
        { key: 'dashboard', label: 'Dashboard', to: '/meal-planning' },
        { key: 'menus', label: 'Menus', to: '/menu-management/menus' },
      ],
    },
  ],
  footerActions: [],
};

function MenuManagementLayout({
  role,
  activeItemKey = 'dashboard',
  title = 'Recipe Management',
  subtitle = 'Design balanced school meals with precision',
  query,
  onQueryChange,
  onQuerySubmit,
  searchPlaceholder,
  children,
}) {
  const navigate = useNavigate();

  const sideBarConfig = useMemo(() => {
    const config = buildSidebarConfig({
      feature: APP_FEATURES.MENU_MANAGEMENT,
      role,
    });

    return config || FALLBACK_MENU_CONFIG;
  }, [role]);

  return (
    <div className="flex min-h-screen bg-[#efefef]">
      <FeatureSidebar
        {...sideBarConfig}
        activeItemKey={activeItemKey}
        onItemSelect={(item) => item.to && navigate(item.to)}
        onFooterAction={(action) => action.to && navigate(action.to)}
      />

      <main className="flex-1 px-6 py-4 lg:px-8">
        <FeatureTopBar
          title={title}
          subtitle={subtitle}
          query={query}
          onQueryChange={onQueryChange}
          onQuerySubmit={onQuerySubmit}
          searchPlaceholder={searchPlaceholder}
        />
        {children}
      </main>
    </div>
  );
}

export default MenuManagementLayout;
