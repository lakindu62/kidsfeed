import { createElement } from 'react';
import { AlertTriangle, Package, ShieldCheck } from 'lucide-react';

export function getItemId(item) {
  return item?.id ?? item?._id ?? '';
}

export function getCategoryLabel(category) {
  switch ((category || '').toUpperCase()) {
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
    case 'EXPIRED':
      return 'text-[#ba1a1a] bg-[#fdecec]';
    case 'OUT_OF_STOCK':
      return 'text-[#8a4b00] bg-[#fff4e5]';
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
    case 'EXPIRED':
      return createElement(AlertTriangle, { className: 'h-3.5 w-3.5' });
    case 'OUT_OF_STOCK':
    default:
      return createElement(Package, { className: 'h-3.5 w-3.5' });
  }
}

export function formatQuantity(item) {
  const quantity = Number.isFinite(item?.quantity) ? item.quantity : 0;
  const unit = item?.unit || 'units';
  return `${quantity} ${unit}`;
}

export function formatPackageSummary(item) {
  const parts = [];

  if (Number.isFinite(item?.packageWeight) && item.packageWeight > 0) {
    parts.push(String(item.packageWeight));
  }

  if (item?.packageWeightUnit) {
    parts.push(item.packageWeightUnit);
  }

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

export function formatQuantityLabel(quantity, unit) {
  const safeQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
  return `${safeQuantity} ${unit || 'units'}`;
}

export function batchTitle(batch, index) {
  const receivedAt = batch?.receivedAt ? formatDate(batch.receivedAt) : '';
  if (receivedAt === 'Not set') {
    return `Batch ${index + 1}`;
  }

  return `Batch ${index + 1} · Received ${receivedAt}`;
}
