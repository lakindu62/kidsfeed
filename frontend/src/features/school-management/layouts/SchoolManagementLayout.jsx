import { useNavigate } from 'react-router-dom';
import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';

function SchoolManagementLayout({
  totalFacilities,
  activeItemKey = 'dashboard',
  title,
  subtitle,
  breadcrumbItems,
  query,
  onQueryChange,
  searchPlaceholder,
  children,
}) {
  const navigate = useNavigate();
  const sidebarConfig = buildSidebarConfig({
    feature: APP_FEATURES.SCHOOL_MANAGEMENT,
  });

  const resolvedTitle = title ?? 'School Overview';
  const resolvedSubtitle =
    subtitle ??
    `Real-time monitoring of meal program participation and eligibility across ${totalFacilities ?? 0} educational facilities in the district.`;

  return (
    <div className="flex h-screen bg-[#f6f8f6]">
      <FeatureSidebar
        {...sidebarConfig}
        activeItemKey={activeItemKey}
        onItemSelect={(item) => item.to && navigate(item.to)}
        onFooterAction={(action) => action.to && navigate(action.to)}
      />

      <main className="flex-1 overflow-y-auto px-8 py-4">
        <FeatureTopBar
          title={resolvedTitle}
          subtitle={resolvedSubtitle}
          breadcrumbItems={breadcrumbItems ?? [{ label: 'Dashboard', href: '/dashboard' }]}
          query={query}
          onQueryChange={onQueryChange}
          searchPlaceholder={searchPlaceholder}
        />
        {children}
      </main>
    </div>
  );
}

export default SchoolManagementLayout;
