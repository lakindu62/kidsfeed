import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CardGrid from '@/components/common/CardGrid';
import FilterBar from '@/components/common/FilterBar';
import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';
import PaginationControls from '@/components/common/PaginationControls';
import StatusMessage from '@/components/common/StatusMessage';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { cn } from '@/lib/utils';
import { LayoutGrid, ListFilter, Package } from 'lucide-react';

import InventoryLayout from '../layouts/InventoryLayout';
import { fetchInventoryItems } from '../api';
import {
  CATEGORY_FILTERS as categoryFilters,
  buildSearchText,
  formatPackageSummary,
  formatQuantity,
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
  const packageSummary = formatPackageSummary(item);

  return (
    <Card className="overflow-hidden rounded-[32px] border border-[#eff1ed] bg-white shadow-[0px_20px_40px_0px_rgba(47,51,49,0.06)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="overflow-hidden rounded-t-[32px] bg-[#f4f5f1]">
        <InventoryMedia item={item} />
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#005412] uppercase">
            {categoryLabel}
          </p>
          <h3 className="text-[1.05rem] leading-tight font-extrabold tracking-[-0.02em] text-[#181c1b]">
            {item?.name || 'Unnamed item'}
          </h3>
          {item?.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-[#5f665f]">
              {item.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {item?.brand ? (
            <Badge className="rounded-full bg-[#f3f4f0] px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              {item.brand}
            </Badge>
          ) : null}
          {item?.reorderLevel !== undefined ? (
            <Badge className="rounded-full bg-[#f3f4f0] px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              Reorder at {item.reorderLevel}
            </Badge>
          ) : null}
          {packageSummary ? (
            <Badge className="rounded-full bg-[#f3f4f0] px-2.5 py-1 text-[10px] font-bold tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
              {packageSummary}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[#f3f4f0] pt-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#40493d]">
            <span>{formatQuantity(item)}</span>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase',
              getStatusTone(item?.status),
            )}
          >
            {getStatusIcon(item?.status)}
            {statusLabel}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-full px-4"
          onClick={() => onOpen(itemId)}
          disabled={!itemId}
        >
          View item
        </Button>
      </CardContent>
    </Card>
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
  }, [apiUrl, getToken, isSignedIn]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, query, viewMode]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      const itemCategory = (item?.category || '').toUpperCase();
      const matchesCategory =
        activeCategory === 'all' || itemCategory === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        buildSearchText(item).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, inventoryItems, query]);

  const itemsPerPage = viewMode === 'grid' ? 8 : 5;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const visibleItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const countLabel = `Showing ${filteredItems.length === 0 ? 0 : startIndex + 1}-${Math.min(
    startIndex + itemsPerPage,
    filteredItems.length,
  )} of ${filteredItems.length} items`;

  const resolvedCategoryFilters = categoryFilters.map((filter) => ({
    ...filter,
    active: activeCategory === filter.key,
  }));

  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Inventory Grid"
      subtitle="Manage school meal ingredients and supplies with backend data."
      query={query}
      onQueryChange={(value) => {
        setQuery(value);
        setPage(1);
      }}
      searchPlaceholder="Search inventory items..."
    >
      <div className="space-y-6 pb-16">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <FilterBar
            filters={resolvedCategoryFilters}
            onToggleFilter={(key) => {
              setActiveCategory(key);
              setPage(1);
            }}
            className="mb-0 rounded-none border-0 bg-transparent p-0 shadow-none"
          />

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <p className="text-sm text-[#7b8079]">{countLabel}</p>
            <div className="inline-flex rounded-full border border-[#e6e9e5] bg-[#f3f4f0] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-full px-4 text-xs font-semibold',
                  viewMode === 'grid'
                    ? 'bg-[#005412] text-white hover:bg-[#005412]'
                    : 'text-[#40493d]',
                )}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-full px-4 text-xs font-semibold',
                  viewMode === 'list'
                    ? 'bg-[#005412] text-white hover:bg-[#005412]'
                    : 'text-[#40493d]',
                )}
                onClick={() => setViewMode('list')}
              >
                <ListFilter className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
          </div>
        </section>

        {loadError ? (
          <StatusMessage kind="error" message={loadError} />
        ) : isLoading ? (
          <StatusMessage
            kind="info"
            message="Loading inventory items from the backend..."
          />
        ) : filteredItems.length === 0 ? (
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
