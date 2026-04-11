import InventoryLayout from '../layouts/InventoryLayout';

function InventoryItemDetailsPage() {
  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Inventory Item Details"
      subtitle="View the item summary and its batches."
    >
      <section className="rounded-[20px] border border-dashed border-[#d7ddd5] bg-white px-6 py-10 text-[#556] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        Item details scaffold. Batch cards and add-batch actions will be added
        in the next gate.
      </section>
    </InventoryLayout>
  );
}

export default InventoryItemDetailsPage;
