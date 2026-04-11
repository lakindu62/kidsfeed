import InventoryLayout from '../layouts/InventoryLayout';

function InventoryNewItemPage() {
  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Add New Inventory Item"
      subtitle="Create a complete inventory item with its initial batch."
    >
      <section className="rounded-[20px] border border-dashed border-[#d7ddd5] bg-white px-6 py-10 text-[#556] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        Add item form scaffold. The full batch-aware form will be implemented in
        the next gate.
      </section>
    </InventoryLayout>
  );
}

export default InventoryNewItemPage;
