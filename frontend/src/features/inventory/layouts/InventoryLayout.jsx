import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function InventoryLayout({
  role,
  activeItemKey = 'inventory',
  title = 'Inventory Grid',
  subtitle = 'Manage school meal ingredients and supplies',
  children,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const sideBarConfig = useMemo(
    () =>
      buildSidebarConfig({ feature: APP_FEATURES.INVENTORY_MANAGEMENT, role }),
    [role],
  );
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
          query={query}
          onQueryChange={setQuery}
          searchPlaceholder="Search inventory..."
        />
        {children}
      </main>
    </div>
  );
}

export default InventoryLayout;
