import InventoryLayout from '../layouts/InventoryLayout';

function InventoryDashboardPage() {
  return (
    <div>
      <InventoryLayout activeItemKey="inventory">
        <section>{/* inventory cards/table/filter chips */}</section>
      </InventoryLayout>
    </div>
  );
}

export default InventoryDashboardPage;
