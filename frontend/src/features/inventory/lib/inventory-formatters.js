import { createElement } from 'react';
import { AlertTriangle, Package, ShieldCheck } from 'lucide-react';

export function getItemId(item) {
  return item?.id ?? item?._id ?? '';
}

export function getCategoryLabel(category) {
  switch ((category || '').toUpperCase()) {
    case 'VEGETABLES':
      return 'Vegetables';
    case 'FRUITS':
      return 'Fruits';
    case 'GRAINS':
      return 'Grains';
    case 'PACKAGED':
      return 'Packaged';
    case 'BISCUITS':
      return 'Biscuits';
    case 'MEAT_FISH':
      return 'Meat & Fish';
    case 'DAIRY':
      return 'Dairy';
    case 'BEVERAGES':
      return 'Beverages';
    case 'SPICES_CONDIMENTS':
      return 'Spices & Condiments';
    case 'SNACKS':
      return 'Snacks';
    case 'BAKING':
      return 'Baking';
    case 'FROZEN':
      return 'Frozen';
    case 'CANNED':
      return 'Canned';
    case 'FOOD':
      return 'Food';
    case 'SUPPLIES':
      return 'Supplies';
    case 'EQUIPMENT':
      return 'Equipment';
    case 'OTHER':
      return 'Other';
    default:
      return 'Uncategorized';
  }
}

export const formatCategoryLabel = getCategoryLabel;

export function getStatusLabel(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'Active';
    case 'LOW_STOCK':
      return 'Low stock';
    case 'OUT_OF_STOCK':
      return 'Out of stock';
    case 'EXPIRED':
      return 'Expired';
    default:
      return 'Unknown';
  }
}

export const formatStatusLabel = getStatusLabel;

export function getStatusTone(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return 'text-[#17602b] bg-[#edf8ef]';
    case 'LOW_STOCK':
      return 'text-[#8a4b00] bg-[#fff4e5]';
    case 'OUT_OF_STOCK':
      return 'text-[#40493d] bg-[#f3f4f0]';
    case 'EXPIRED':
      return 'text-[#ba1a1a] bg-[#fdecec]';
    default:
      return 'text-[#40493d] bg-[#f3f4f0]';
  }
}

export const statusTone = getStatusTone;

export function getStatusIcon(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return createElement(ShieldCheck, { className: 'h-3.5 w-3.5' });
    case 'LOW_STOCK':
      return createElement(AlertTriangle, { className: 'h-3.5 w-3.5' });
    case 'EXPIRED':
      return createElement(AlertTriangle, { className: 'h-3.5 w-3.5' });
    case 'OUT_OF_STOCK':
    default:
      return createElement(Package, { className: 'h-3.5 w-3.5' });
  }
}

export function getExpiryStatusLabel(expiryStatus) {
  switch ((expiryStatus || '').toUpperCase()) {
    case 'SAFE':
      return 'Safe';
    case 'PARTIALLY_EXPIRED':
      return 'Partially expired';
    case 'TOTALLY_EXPIRED':
      return 'Totally expired';
    case 'UNAVAILABLE':
      return 'Expiry unavailable';
    default:
      return 'Unknown';
  }
}

export const formatExpiryStatusLabel = getExpiryStatusLabel;

export function getExpiryStatusTone(expiryStatus) {
  switch ((expiryStatus || '').toUpperCase()) {
    case 'SAFE':
      return 'text-[#17602b] bg-[#edf8ef]';
    case 'PARTIALLY_EXPIRED':
      return 'text-[#8a4b00] bg-[#fff4e5]';
    case 'TOTALLY_EXPIRED':
      return 'text-[#ba1a1a] bg-[#fdecec]';
    case 'UNAVAILABLE':
      return 'text-[#40493d] bg-[#f3f4f0]';
    default:
      return 'text-[#40493d] bg-[#f3f4f0]';
  }
}

export function getExpiryStatusIcon(expiryStatus) {
  switch ((expiryStatus || '').toUpperCase()) {
    case 'SAFE':
      return createElement(ShieldCheck, { className: 'h-3.5 w-3.5' });
    case 'PARTIALLY_EXPIRED':
      return createElement(AlertTriangle, { className: 'h-3.5 w-3.5' });
    case 'TOTALLY_EXPIRED':
      return createElement(AlertTriangle, { className: 'h-3.5 w-3.5' });
    case 'UNAVAILABLE':
    default:
      return createElement(Package, { className: 'h-3.5 w-3.5' });
  }
}

export function formatQuantity(item) {
  const quantity = Number.isFinite(Number(item?.quantity))
    ? Number(item.quantity)
    : 0;
  const unit = item?.unit || 'units';
  return `${formatQuantityValue(quantity)} ${unit}`;
}

export function formatPackageSummary(item) {
  const parts = [];

  if (item?.packageType) {
    parts.push(item.packageType);
  }

  return parts.join(' ').trim();
}

export function buildSearchText(item) {
  return [
    item?.name,
    item?.description,
    item?.brand,
    item?.barcode,
    item?.category,
    item?.status,
    item?.expiryStatus,
    item?.ingredients,
    item?.unit,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 'N/A';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 2,
  }).format(numberValue);
}

function formatQuantityValue(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '0';
  }

  return new Intl.NumberFormat(undefined, {
    useGrouping: false,
    maximumFractionDigits: 3,
  }).format(numberValue);
}

export function formatQuantityLabel(quantity, unit) {
  const safeQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  return `${formatQuantityValue(safeQuantity)} ${unit || 'units'}`;
}

export function batchTitle(batch, index) {
  const receivedAt = batch?.receivedAt ? formatDate(batch.receivedAt) : '';
  if (receivedAt === 'Not set') {
    return `Batch ${index + 1}`;
  }

  return `Batch ${index + 1} · Received ${receivedAt}`;
}
