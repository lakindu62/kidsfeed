import { USER_ROLES } from '@/lib/user-roles';
import React from 'react';
import InventoryLayout from '../layouts/InventoryLayout';

function InventoryDashboardPage() {
  const role = USER_ROLES.INVENTORY_MANAGER; // This would typically come from user authentication context or props

  return (
    <div>
      <InventoryLayout role={role} activeItemKey="inventory">
        <section>{/* inventory cards/table/filter chips */}</section>
      </InventoryLayout>
    </div>
  );
}

export default InventoryDashboardPage;
