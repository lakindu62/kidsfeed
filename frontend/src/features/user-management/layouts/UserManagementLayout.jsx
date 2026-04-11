import FeatureSidebar from '@/components/common/FeatureSidebar';
import FeatureTopBar from '@/components/common/FeatureTopBar';
import { APP_FEATURES } from '@/lib/app-features';
import { buildSidebarConfig } from '@/lib/sidebar';
import { useNavigate } from 'react-router-dom';

export default function UserManagementLayout({
  activeItemKey = 'users',
  title = 'User Access Control',
  subtitle = 'Manage roles and account access for users across the Kidsfeed platform.',
  children,
}) {
  const navigate = useNavigate();
  const sideBarConfig = buildSidebarConfig({
    feature: APP_FEATURES.USER_MANAGEMENT,
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
        <FeatureTopBar title={title} subtitle={subtitle} searchPlaceholder="" />
        {children}
      </main>
    </div>
  );
}
