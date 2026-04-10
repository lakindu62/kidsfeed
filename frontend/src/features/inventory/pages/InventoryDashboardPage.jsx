import { useAuthRole } from '@/lib/auth/use-auth-role';
import InventoryLayout from '../layouts/InventoryLayout';

function InventoryDashboardPage() {
  const { role } = useAuthRole();

  return (
    <div>
      <InventoryLayout role={role} activeItemKey="inventory">
        <section>{/* inventory cards/table/filter chips */}</section>
      </InventoryLayout>
    </div>
  );
}

export default InventoryDashboardPage;
