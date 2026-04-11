export const initialFormState = {
  name: '',
  category: 'FOOD',
  unit: 'pieces',
  barcode: '',
  description: '',
  brand: '',
  allergensText: '',
  tracesText: '',
  ingredients: '',
  imageUrl: '',
  nutritionalGrade: '',
  reorderLevel: '10',
  packageWeight: '',
  packageWeightUnit: '',
  packageType: '',
  quantity: '',
  expiryDate: '',
  supplier: '',
  unitPrice: '',
  location: '',
  batchNote: '',
};

export const initialBatchFormState = {
  quantity: '',
  expiryDate: '',
  supplier: '',
  unitPrice: '',
  location: '',
  batchNote: '',
};

export function splitListValue(value) {
  return String(value || '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function lookupToFormSummary(item) {
  if (!item) {
    return null;
  }

  return {
    name: item.name || '',
    brand: item.brand || '',
    imageUrl: item.imageUrl || '',
    nutritionalGrade: item.nutritionalGrade || '',
    packageWeight:
      item.packageWeight !== undefined && item.packageWeight !== null
        ? String(item.packageWeight)
        : '',
    packageWeightUnit: item.packageWeightUnit || '',
    packageType: item.packageType || '',
    ingredients: item.ingredients || '',
    allergens: Array.isArray(item.allergens) ? item.allergens : [],
    traces: Array.isArray(item.traces) ? item.traces : [],
    unit: item.unit || '',
  };
}
