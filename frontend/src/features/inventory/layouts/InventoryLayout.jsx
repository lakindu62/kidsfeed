import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function InventoryLayout({
  activeItemKey = 'inventory',
  title = 'Inventory Grid',
  subtitle = 'Manage school meal ingredients and supplies',
  query: controlledQuery,
  onQueryChange,
  searchPlaceholder = 'Search inventory...',
  children,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const resolvedQuery = controlledQuery ?? query;
  const handleQueryChange = onQueryChange ?? setQuery;

  const sideBarConfig = buildSidebarConfig({
    feature: APP_FEATURES.INVENTORY_MANAGEMENT,
  });
  return (
    <div className="flex min-h-screen bg-[#f3f4f2]">
      <FeatureSidebar
        {...sideBarConfig}
        activeItemKey={activeItemKey}
        onItemSelect={(item) => item.to && navigate(item.to)}
        onFooterAction={(action) => action.to && navigate(action.to)}
      />

      <main className="flex-1 px-8 py-6">
        <FeatureTopBar
          title={title}
          subtitle={subtitle}
          query={resolvedQuery}
          onQueryChange={handleQueryChange}
          searchPlaceholder={searchPlaceholder}
        />
        {children}
      </main>
    </div>
  );
}

export default InventoryLayout;
