import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMealDistributionSchool } from '../hooks';

export default function MealDistributionLayout({
  activeItemKey = 'dashboard',
  title,
  subtitle,
  breadcrumbItems,
  query,
  onQueryChange,
  searchPlaceholder = 'Search...',
  children,
}) {
  const navigate = useNavigate();
  const { schoolName } = useMealDistributionSchool();

  const sideBarConfig = useMemo(
    () => buildSidebarConfig({ feature: APP_FEATURES.MEAL_DISTRIBUTION }),
    [],
  );

  const resolvedSubtitle = subtitle ?? schoolName;

  return (
    <div className="min-h-screen bg-[#f6f6f6] text-zinc-900">
      <div className="mx-auto flex w-full max-w-[1536px]">
        <FeatureSidebar
          {...sideBarConfig}
          activeItemKey={activeItemKey}
          onItemSelect={(item) => item.to && navigate(item.to)}
          onFooterAction={(action) => action.to && navigate(action.to)}
        />
        <main className="w-[1280px] shrink-0 pt-3 pr-10 pb-8 pl-6">
          <FeatureTopBar
            title={title}
            subtitle={resolvedSubtitle}
            query={query}
            onQueryChange={onQueryChange}
            searchPlaceholder={searchPlaceholder}
            breadcrumbItems={breadcrumbItems}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
