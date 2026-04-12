import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
        <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <Badge className="typography-body-sm rounded-full bg-[#f3f4f0] px-3 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
                  Coming soon
                </Badge>
                <h2 className="typography-h1 text-[#181c1b]">
                  Inventory landing dashboard scaffold
                </h2>
              </div>
            </div>

            <p className="typography-body max-w-3xl text-[#5f665f]">
              This route is reserved for the dashboard view in the next
              implementation step. It is kept in the same visual language as the
              rest of the inventory module so the final dashboard can slot in
              without restructuring the page.
            </p>
          </CardContent>
        </Card>
      </InventoryLayout>

      <NewSessionFloatingButton
        label="Add New Inventory Item"
        onClick={() => navigate('/inventory/items/new')}
      />
    </div>
  );
}

export default InventoryDashboardPage;
