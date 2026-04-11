import { useNavigate } from 'react-router-dom';

import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';

import InventoryLayout from '../layouts/InventoryLayout';

function InventoryDashboardPage() {
  const navigate = useNavigate();

  return (
    <div>
      <InventoryLayout
        activeItemKey="dashboard"
        title="Inventory Dashboard"
        subtitle="Overview of stock movement, pending actions, and school pantry health."
      >
        <section className="rounded-[20px] border border-dashed border-[#d7ddd5] bg-white px-6 py-10 text-[#556] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          Inventory landing dashboard scaffold. This route is reserved for the
          dashboard view in the next implementation step.
        </section>
      </InventoryLayout>

      <NewSessionFloatingButton
        label="Add New Inventory Item"
        onClick={() => navigate('/inventory/items/new')}
      />
    </div>
  );
}

export default InventoryDashboardPage;
