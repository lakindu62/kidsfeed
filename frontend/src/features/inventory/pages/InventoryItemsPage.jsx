import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import CardGrid from '@/components/common/CardGrid';
import { Input } from '@/components/ui/input';
import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';
import PaginationControls from '@/components/common/PaginationControls';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatusMessage from '@/components/common/StatusMessage';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

import InventoryLayout from '../layouts/InventoryLayout';
import { fetchInventoryItems } from '../api';
import {
  CATEGORY_OPTIONS as categoryOptions,
  formatPackageSummary,
  formatQuantity,
  getExpiryStatusIcon,
  getExpiryStatusLabel,
  getExpiryStatusTone,
  getCategoryLabel,
  getItemId,
  getStatusIcon,
  getStatusLabel,
  getStatusTone,
} from '../lib';
import InventoryListRow from '../components/InventoryListRow';

function InventoryMedia({ item }) {
  if (item?.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item?.name || 'Inventory item'}
        className="h-45 w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-45 items-center justify-center bg-[linear-gradient(135deg,#ecf3ea_0%,#e0e8de_100%)] text-[#5f665f]">
      <Package className="h-10 w-10" />
    </div>
  );
}

function InventoryGridCard({ item, onOpen }) {
  const itemId = getItemId(item);
  const categoryLabel = getCategoryLabel(item?.category);
  const statusLabel = getStatusLabel(item?.status);
  const expiryStatusLabel = getExpiryStatusLabel(item?.expiryStatus);
  const packageSummary = formatPackageSummary(item);
  const hasExpiryStatus =
    item?.expiryStatus !== undefined && item?.expiryStatus !== null;
  const isOpenable = Boolean(itemId);

  const cardBody = (
    <Card
      className={cn(
        'overflow-hidden rounded-[32px] border border-[#eff1ed] bg-white shadow-[0px_20px_40px_0px_rgba(47,51,49,0.06)] transition-transform duration-200',
        isOpenable ? 'cursor-pointer hover:-translate-y-0.5' : '',
      )}
    >
      <div className="overflow-hidden rounded-t-[32px] bg-[#f4f5f1]">
        <InventoryMedia item={item} />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="typography-body-sm tracking-[0.16em] text-[#005412] uppercase">
            {categoryLabel}
          </p>
          <h3 className="typography-h2 text-[#181c1b]">
            {item?.name || 'Unnamed item'}
          </h3>
          {item?.description ? (
            <p className="typography-body line-clamp-2 text-[#5f665f]">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {item?.brand ? (
            <Badge className="typography-body-sm rounded-full bg-[#f3f4f0] px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              {item.brand}
            </Badge>
          ) : null}
          {item?.reorderLevel !== undefined ? (
            <Badge className="typography-body-sm rounded-full bg-[#f3f4f0] px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              Reorder at {item.reorderLevel}
            </Badge>
          ) : null}
          {packageSummary ? (
            <Badge className="typography-body-sm rounded-full bg-[#f3f4f0] px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              {packageSummary}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-[#f3f4f0] pt-3">
          <div className="typography-body flex items-center gap-2 text-[#40493d]">
            <span>{formatQuantity(item)}</span>
          </div>

          <div
            className={cn(
              'flex items-center gap-2',
              hasExpiryStatus ? 'justify-between' : 'justify-end',
            )}
          >
            {hasExpiryStatus ? (
              <div
                className={cn(
                  'typography-body-sm inline-flex items-center gap-1 rounded-full px-2.5 py-1 tracking-widest uppercase',
                  getExpiryStatusTone(item?.expiryStatus),
                )}
              >
                {getExpiryStatusIcon(item?.expiryStatus)}
                {expiryStatusLabel}
              </div>
            ) : null}

            <div
              className={cn(
                'typography-body-sm inline-flex items-center gap-1 rounded-full px-2.5 py-1 tracking-widest uppercase',
                getStatusTone(item?.status),
              )}
            >
              {getStatusIcon(item?.status)}
              {statusLabel}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isOpenable) {
    return cardBody;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(itemId)}
      className="block w-full rounded-[32px] text-left focus-visible:ring-2 focus-visible:ring-[#005412]/40 focus-visible:outline-none"
      aria-label={`Open ${item?.name || 'inventory item'}`}
    >
      {cardBody}
    </button>
  );
}

function InventoryItemsPage() {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isActive = true;

    async function loadInventoryItems() {
      if (!apiUrl) {
        setInventoryItems([]);
        setLoadError('Could not resolve API base URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const items = await fetchInventoryItems({
          apiUrl,
          getToken: isSignedIn ? getToken : undefined,
          searchParams: {
            category: activeCategory === 'all' ? undefined : activeCategory,
            status: activeStatus === 'all' ? undefined : activeStatus,
            search: query.trim() || undefined,
          },
        });

        if (isActive) {
          setInventoryItems(items);
        }
      } catch (error) {
        if (isActive) {
          setInventoryItems([]);
          setLoadError(
            describeApiFetchFailure(error, 'Could not load inventory items.'),
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInventoryItems();

    return () => {
      isActive = false;
    };
  }, [apiUrl, getToken, isSignedIn, activeCategory, activeStatus, query]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeStatus, query, viewMode]);

  const itemsPerPage = viewMode === 'grid' ? 8 : 5;
  const totalPages = Math.max(
    1,
    Math.ceil(inventoryItems.length / itemsPerPage),
  );
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleItems = inventoryItems.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const countLabel = `Showing ${inventoryItems.length === 0 ? 0 : startIndex + 1}-${Math.min(
    startIndex + itemsPerPage,
    inventoryItems.length,
  )} of ${inventoryItems.length} items`;

  const viewModeOptions = [
    { value: 'grid', label: 'Grid view' },
    { value: 'list', label: 'List view' },
  ];
  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'LOW_STOCK', label: 'Low stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of stock' },
    { value: 'EXPIRED', label: 'Expired' },
  ];
  const categoryFilterOptions = [
    { value: 'all', label: 'All categories' },
    ...categoryOptions,
  ];

  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Inventory Grid"
      subtitle="Manage school meal ingredients and supplies with backend data."
      searchPlaceholder=""
    >
      <div className="space-y-6 pb-16">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-start">
          <div className="flex w-full flex-wrap items-center justify-start gap-3">
            <Select
              value={activeCategory}
              onValueChange={(value) => {
                setActiveCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="typography-body-sm h-11 w-56 rounded-full border border-[#dde3dd] bg-[#f4f4f2] px-4 text-[#4b4f4c]"
                aria-label="Category filter"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activeStatus}
              onValueChange={(value) => {
                setActiveStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="typography-body-sm h-11 w-56 rounded-full border border-[#dde3dd] bg-[#f4f4f2] px-4 text-[#4b4f4c]"
                aria-label="Status filter"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="typography-body-sm h-11 w-56 rounded-full border border-[#dde3dd] bg-[#f4f4f2] px-4 text-[#4b4f4c] placeholder:text-[#7b8079]"
              placeholder="Search inventory"
              aria-label="Search inventory"
            />

            <Select
              value={viewMode}
              onValueChange={(value) => {
                setViewMode(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="typography-body-sm h-11 w-56 rounded-full border border-[#dde3dd] bg-[#f4f4f2] px-4 text-[#4b4f4c]"
                aria-label="View mode"
              >
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                {viewModeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 self-start lg:ml-auto lg:self-center">
            <p className="typography-body-sm text-[#7b8079]">{countLabel}</p>
          </div>
        </section>

        {loadError ? (
          <StatusMessage kind="error" message={loadError} />
        ) : isLoading ? (
          <StatusMessage
            kind="info"
            message="Loading inventory items from the backend..."
          />
        ) : inventoryItems.length === 0 ? (
          <StatusMessage
            kind="info"
            message="No inventory items matched your current search or filter selection."
          />
        ) : viewMode === 'grid' ? (
          <CardGrid
            items={visibleItems}
            columnsClassName="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4"
            renderItem={(item) => (
              <InventoryGridCard
                key={getItemId(item)}
                item={item}
                onOpen={(itemId) => navigate(`/inventory/items/${itemId}`)}
              />
            )}
            className="items-start"
          />
        ) : (
          <div className="space-y-4">
            {visibleItems.map((item) => (
              <InventoryListRow
                key={getItemId(item)}
                item={item}
                onOpen={(itemId) => navigate(`/inventory/items/${itemId}`)}
              />
            ))}
          </div>
        )}

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          onPrevious={() => setPage((current) => Math.max(1, current - 1))}
          onPageSelect={(selectedPage) => setPage(selectedPage)}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="mt-2"
        />
      </div>

      <NewSessionFloatingButton
        label="Add New Inventory Item"
        onClick={() => navigate('/inventory/items/new')}
      />
    </InventoryLayout>
  );
}

export default InventoryItemsPage;
