import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import MetricCard from '@/components/common/MetricCard';
import PageHero from '@/components/common/PageHero';
import StatusMessage from '@/components/common/StatusMessage';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';
import { cn } from '@/lib/utils';
import {
  CalendarClock,
  ClipboardList,
  Layers3,
  MapPin,
  Package,
  Plus,
  Tag,
  Truck,
  Weight,
} from 'lucide-react';

import InventoryLayout from '../layouts/InventoryLayout';
import { addInventoryBatch, fetchInventoryItemById } from '../api';
import {
  batchTitle,
  formatCategoryLabel,
  formatCurrency,
  formatDate,
  formatQuantityLabel,
  getExpiryStatusIcon,
  getExpiryStatusLabel,
  getExpiryStatusTone,
  formatStatusLabel,
  initialBatchFormState,
  statusTone,
  toOptionalNumber,
} from '../lib';

function BatchField({ label, required, children, className }) {
  return (
    <label className={cn('flex flex-col gap-2', className)}>
      <span className="typography-body-sm text-[#202421]">
        {label}
        {required ? <span className="ml-1 text-[#ba1a1a]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function InventoryItemDetailsPage() {
  const { isSignedIn, getToken } = useAuth();
  const apiBaseUrl = resolveApiBaseUrl();
  const navigate = useNavigate();
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState(initialBatchFormState);
  const [batchError, setBatchError] = useState('');
  const [batchSuccess, setBatchSuccess] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const batches = useMemo(() => {
    return [...(item?.batches || [])].sort((left, right) => {
      const rightDate = new Date(right?.receivedAt || 0).getTime();
      const leftDate = new Date(left?.receivedAt || 0).getTime();
      return rightDate - leftDate;
    });
  }, [item]);

  const overviewRows = useMemo(() => {
    if (!item) {
      return [];
    }

    return [
      { label: 'Barcode', value: item.barcode || 'Not set' },
      { label: 'Category', value: formatCategoryLabel(item.category) },
      { label: 'Unit', value: item.unit || 'Not set' },
      { label: 'Brand', value: item.brand || 'Not set' },
      {
        label: 'Nutrition grade',
        value: item.nutritionalGrade
          ? item.nutritionalGrade.toUpperCase()
          : 'Not set',
      },
      {
        label: 'Package type',
        value: item.packageType || 'Not set',
      },
      { label: 'Reorder level', value: item.reorderLevel ?? 'Not set' },
      {
        label: 'Allergens',
        value:
          Array.isArray(item.allergens) && item.allergens.length > 0
            ? item.allergens.join(', ')
            : 'None recorded',
      },
      {
        label: 'Traces',
        value:
          Array.isArray(item.traces) && item.traces.length > 0
            ? item.traces.join(', ')
            : 'None recorded',
      },
      { label: 'Ingredients', value: item.ingredients || 'Not set' },
      { label: 'Description', value: item.description || 'Not set' },
    ];
  }, [item]);

  const totalBatchQuantity = useMemo(() => {
    return batches.reduce((sum, batch) => {
      const quantity = Number(batch?.quantity);
      return sum + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }, [batches]);

  const batchExpiryDate = batchForm.expiryDate
    ? parseISO(batchForm.expiryDate)
    : undefined;

  const openBatchSheet = () => {
    setBatchError('');
    setBatchSuccess('');
    setIsAddBatchOpen(true);
  };

  const loadItem = async () => {
    if (!apiBaseUrl || !itemId) {
      setItem(null);
      setLoadError(
        !apiBaseUrl ? 'Could not resolve API base URL.' : 'Missing item ID.',
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const loadedItem = await fetchInventoryItemById({
        apiUrl: apiBaseUrl,
        itemId,
        getToken: isSignedIn ? getToken : undefined,
      });

      setItem(loadedItem || null);
    } catch (error) {
      setItem(null);
      setLoadError(
        describeApiFetchFailure(
          error,
          'Could not load inventory item details.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, itemId, isSignedIn]);

  const handleBatchChange = (field) => (event) => {
    const { value } = event.target;
    setBatchForm((current) => ({ ...current, [field]: value }));
  };

  const handleBatchSubmit = async (event) => {
    event.preventDefault();

    if (!apiBaseUrl || !itemId) {
      setBatchError('Could not resolve API base URL or item ID.');
      return;
    }

    const quantity = toOptionalNumber(batchForm.quantity);

    if (quantity === undefined) {
      setBatchError('Quantity is required.');
      return;
    }

    setBatchError('');
    setBatchSuccess('');
    setIsSavingBatch(true);

    try {
      const updatedItem = await addInventoryBatch({
        apiUrl: apiBaseUrl,
        itemId,
        getToken: isSignedIn ? getToken : undefined,
        payload: {
          quantity,
          expiryDate: batchForm.expiryDate || undefined,
          supplier: batchForm.supplier.trim(),
          unitPrice: toOptionalNumber(batchForm.unitPrice),
          location: batchForm.location.trim(),
          batchNote: batchForm.batchNote.trim(),
        },
      });

      setItem(updatedItem || null);
      setBatchForm(initialBatchFormState);
      setBatchSuccess('Inventory batch added successfully.');
      setIsAddBatchOpen(false);
    } catch (error) {
      setBatchError(
        describeApiFetchFailure(error, 'Could not add inventory batch.'),
      );
      setIsAddBatchOpen(true);
    } finally {
      setIsSavingBatch(false);
    }
  };

  if (!isLoading && (!item || loadError)) {
    return (
      <InventoryLayout
        activeItemKey="inventory"
        title="Inventory Item Details"
        subtitle="View the item summary and its batches."
      >
        <div className="space-y-6 pb-16">
          <PageHero
            eyebrow="Inventory detail"
            title="Inventory Item Details"
            description="Open a single inventory item to review its fields, batch history, and current stock state."
            actionLabel="Back to items"
            actionTo="/inventory/items"
          />

          {loadError ? (
            <StatusMessage kind="error" message={loadError} />
          ) : null}
          {!loadError ? (
            <StatusMessage
              kind="info"
              message="No inventory item could be loaded."
            />
          ) : null}

          <Button
            type="button"
            className="rounded-full bg-[#005412] text-white hover:bg-[#00460f]"
            onClick={() => navigate('/inventory/items')}
          >
            Return to items
          </Button>
        </div>
      </InventoryLayout>
    );
  }

  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Inventory Item Details"
      subtitle="View the item summary and its batches."
    >
      <div className="space-y-6 pb-16">
        <PageHero
          eyebrow="Inventory detail"
          title={item?.name || 'Inventory Item Details'}
          description={
            item?.description ||
            'Review the item details, metadata, and its batch history.'
          }
          actionLabel="Back to items"
          actionTo="/inventory/items"
        />

        {loadError ? <StatusMessage kind="error" message={loadError} /> : null}
        {batchError ? (
          <StatusMessage kind="error" message={batchError} />
        ) : null}
        {batchSuccess ? (
          <StatusMessage kind="success" message={batchSuccess} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Package className="h-5 w-5" />}
            value={formatQuantityLabel(item?.quantity, item?.unit)}
            label="Current quantity"
          />
          <MetricCard
            icon={<Layers3 className="h-5 w-5" />}
            value={batches.length}
            label="Batch count"
          />
          <MetricCard
            icon={<Weight className="h-5 w-5" />}
            value={item?.reorderLevel ?? 'Not set'}
            label="Reorder level"
          />
          <MetricCard
            icon={<Tag className="h-5 w-5" />}
            value={formatStatusLabel(item?.status)}
            label="Item status"
            tone="highlight"
          />
        </div>

        <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                  Item summary
                </p>
                <h2 className="typography-h1 text-[#181c1b]">
                  Overview and metadata
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    'typography-body-sm rounded-full px-3 py-1 tracking-widest uppercase hover:bg-inherit',
                    statusTone(item?.status),
                  )}
                >
                  {formatStatusLabel(item?.status)}
                </Badge>
                <Badge className="typography-body-sm rounded-full bg-[#f3f4f0] px-3 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-[#f3f4f0]">
                  {formatCategoryLabel(item?.category)}
                </Badge>
                {item?.expiryStatus !== undefined &&
                item?.expiryStatus !== null ? (
                  <Badge
                    className={cn(
                      'typography-body-sm rounded-full px-3 py-1 tracking-widest uppercase hover:bg-inherit',
                      getExpiryStatusTone(item?.expiryStatus),
                    )}
                  >
                    {getExpiryStatusIcon(item?.expiryStatus)}
                    <span className="ml-1">
                      {getExpiryStatusLabel(item?.expiryStatus)}
                    </span>
                  </Badge>
                ) : null}
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="overview" className="space-y-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList
                  variant="line"
                  className="rounded-full bg-[#f3f4f0] p-1"
                >
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="batches">Batches</TabsTrigger>
                </TabsList>

                <Button
                  type="button"
                  className="typography-body-sm rounded-full bg-[#005412] text-white hover:bg-[#00460f]"
                  onClick={openBatchSheet}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add batch
                </Button>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <Card className="rounded-[24px] border border-[#e6e9e5] bg-[#fbfcfb]">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-44">Field</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overviewRows.map((row) => (
                            <TableRow key={row.label}>
                              <TableCell className="typography-body-sm text-[#40493d]">
                                {row.label}
                              </TableCell>
                              <TableCell className="typography-body text-[#181c1b]">
                                {row.value}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border border-[#e6e9e5] bg-[#fbfcfb]">
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-1">
                        <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                          Batch summary
                        </p>
                        <h3 className="typography-body-lg text-[#181c1b]">
                          Live stock snapshot
                        </h3>
                      </div>

                      <div className="typography-body space-y-3 text-[#40493d]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-[#005412]" />
                            Batches recorded
                          </span>
                          <span className="typography-body-sm text-[#181c1b]">
                            {batches.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2">
                            <Package className="h-4 w-4 text-[#005412]" />
                            Quantity across batches
                          </span>
                          <span className="typography-body-sm text-[#181c1b]">
                            {formatQuantityLabel(
                              totalBatchQuantity,
                              item?.unit,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-[#005412]" />
                            Latest received batch
                          </span>
                          <span className="typography-body-sm text-[#181c1b]">
                            {batches[0]?.receivedAt
                              ? formatDate(batches[0].receivedAt)
                              : 'Not set'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="batches" className="space-y-5">
                {batches.length === 0 ? (
                  <StatusMessage
                    kind="info"
                    message="No batches have been recorded for this item yet. Use Add batch to create the first one."
                  />
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {batches.map((batch, index) => (
                      <Card
                        key={
                          batch?._id ||
                          batch?.id ||
                          `${batch?.receivedAt || 'batch'}-${index}`
                        }
                        className="rounded-[24px] border border-[#e6e9e5] bg-white shadow-[0px_10px_24px_rgba(47,51,49,0.05)]"
                      >
                        <CardContent className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                                Batch {index + 1}
                              </p>
                              <h3 className="typography-body-lg mt-1 text-[#181c1b]">
                                {batchTitle(batch, index)}
                              </h3>
                            </div>
                            <Badge
                              className={cn(
                                'typography-body-sm rounded-full px-3 py-1 tracking-widest uppercase hover:bg-inherit',
                                statusTone(batch?.status || item?.status),
                              )}
                            >
                              {formatStatusLabel(batch?.status || item?.status)}
                            </Badge>
                          </div>

                          <div className="typography-body grid gap-3 text-[#40493d]">
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2">
                                <Package className="h-4 w-4 text-[#005412]" />
                                Quantity
                              </span>
                              <span className="typography-body-sm text-[#181c1b]">
                                {formatQuantityLabel(
                                  batch?.quantity,
                                  item?.unit,
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2">
                                <Truck className="h-4 w-4 text-[#005412]" />
                                Supplier
                              </span>
                              <span className="typography-body-sm text-[#181c1b]">
                                {batch?.supplier || 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2">
                                <Weight className="h-4 w-4 text-[#005412]" />
                                Unit price
                              </span>
                              <span className="typography-body-sm text-[#181c1b]">
                                {formatCurrency(batch?.unitPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#005412]" />
                                Location
                              </span>
                              <span className="typography-body-sm text-[#181c1b]">
                                {batch?.location || 'Not set'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="inline-flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-[#005412]" />
                                Expiry date
                              </span>
                              <span className="typography-body-sm text-[#181c1b]">
                                {formatDate(batch?.expiryDate)}
                              </span>
                            </div>
                          </div>

                          <Separator />

                          <p className="typography-body text-[#5f665f]">
                            {batch?.batchNote || 'No batch note recorded.'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="typography-h2">Add batch</SheetTitle>
            <SheetDescription className="typography-body">
              Create a new stock batch for this inventory item. Status and
              expiry state stay server-managed.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleBatchSubmit}
            className="flex h-full flex-1 flex-col gap-5 px-6 pb-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <BatchField label="Quantity" required>
                <Input
                  type="number"
                  min="0"
                  value={batchForm.quantity}
                  onChange={handleBatchChange('quantity')}
                  placeholder="0"
                />
              </BatchField>
              <BatchField label="Expiry date">
                <DatePicker
                  date={batchExpiryDate}
                  setDate={(date) =>
                    setBatchForm((current) => ({
                      ...current,
                      expiryDate: date ? format(date, 'yyyy-MM-dd') : '',
                    }))
                  }
                  compact
                  placeholder="Pick a date"
                  buttonClassName="h-10 rounded-[12px] px-3 typography-body-sm"
                />
              </BatchField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BatchField label="Supplier">
                <Input
                  value={batchForm.supplier}
                  onChange={handleBatchChange('supplier')}
                  placeholder="Optional"
                />
              </BatchField>
              <BatchField label="Unit price">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={batchForm.unitPrice}
                  onChange={handleBatchChange('unitPrice')}
                  placeholder="0.00"
                />
              </BatchField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <BatchField label="Location">
                <Input
                  value={batchForm.location}
                  onChange={handleBatchChange('location')}
                  placeholder="Storage area"
                />
              </BatchField>
              <div className="hidden md:block" />
            </div>

            <BatchField label="Batch note">
              <Textarea
                value={batchForm.batchNote}
                onChange={handleBatchChange('batchNote')}
                placeholder="Optional note about the batch"
                className="min-h-28"
              />
            </BatchField>

            {batchError ? (
              <StatusMessage kind="error" message={batchError} />
            ) : null}

            <SheetFooter className="px-0 pb-0">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  className="typography-body-sm h-11 flex-1 rounded-full bg-[#005412] text-white hover:bg-[#00460f]"
                  disabled={isSavingBatch}
                >
                  {isSavingBatch ? 'Saving...' : 'Save batch'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="typography-body-sm h-11 flex-1 rounded-full"
                  onClick={() => setIsAddBatchOpen(false)}
                  disabled={isSavingBatch}
                >
                  Cancel
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </InventoryLayout>
  );
}

export default InventoryItemDetailsPage;
