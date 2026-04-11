import { useNavigate } from 'react-router-dom';

import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';

import InventoryLayout from '../layouts/InventoryLayout';

function InventoryItemsPage() {
  const navigate = useNavigate();

  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Inventory Grid"
      subtitle="Manage school meal ingredients and supplies with precision."
    >
      <section className="rounded-[20px] border border-dashed border-[#d7ddd5] bg-white px-6 py-10 text-[#556] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        Inventory item browsing scaffold. This route is ready for the grid/list
        implementation in the next stop-gated phase.
      </section>

      <NewSessionFloatingButton
        label="Add New Inventory Item"
        onClick={() => navigate('/inventory/items/new')}
      />
    </InventoryLayout>
  );
}

export default InventoryItemsPage;
