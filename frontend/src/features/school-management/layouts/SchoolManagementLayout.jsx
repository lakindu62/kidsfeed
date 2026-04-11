import { useNavigate } from 'react-router-dom';
import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';

function SchoolManagementLayout({
  totalFacilities,
  activeItemKey = 'dashboard',
  children,
}) {
  const navigate = useNavigate();
  const sidebarConfig = buildSidebarConfig({
    feature: APP_FEATURES.SCHOOL_MANAGEMENT,
  });

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
          title="School Overview"
          subtitle={`
              Real-time monitoring of meal program participation and eligibility across
             ${totalFacilities} educational facilities in
              the district.`}
          breadcrumbItems={[{ label: 'Dashboard', href: '/dashboard' }]}
        />
        {children}
      </main>
    </div>
  );
}

export default SchoolManagementLayout;
