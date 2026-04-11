import { useAuth } from '@clerk/clerk-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHero from '@/components/common/PageHero';
import StatusMessage from '@/components/common/StatusMessage';
import { describeApiFetchFailure } from '@/lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '@/lib/resolve-api-base';

import InventoryLayout from '../layouts/InventoryLayout';
import {
  createInventoryItem,
  lookupExistingInventoryItem,
  lookupInventoryItemByBarcode,
} from '../api';
import {
  CATEGORY_OPTIONS,
  NUTRITIONAL_GRADE_OPTIONS,
  UNIT_OPTIONS,
  initialFormState,
  lookupToFormSummary,
  splitListValue,
  toOptionalNumber,
} from '../lib';

const EMPTY_SELECT_VALUE = '__empty__';

function Field({ label, required, rightNode, className, ...inputProps }) {
  return (
    <label
      className={
        className ? `flex flex-col gap-2 ${className}` : 'flex flex-col gap-2'
      }
    >
      <span className="typography-body-sm text-[#202421]">
        {label}
        {required ? <span className="ml-1 text-[#ba1a1a]">*</span> : null}
      </span>
      <div className="flex items-center gap-3">
        <input
          {...inputProps}
          className="typography-body h-11 flex-1 rounded-[14px] border border-[#dfe5dc] bg-white px-4 text-[#202421] transition-colors outline-none placeholder:text-[#8a9187] focus:border-[#005412] focus:ring-2 focus:ring-[#005412]/10"
        />
        {rightNode ? <div className="shrink-0">{rightNode}</div> : null}
      </div>
    </label>
  );
}

function TextareaField({ label, required, className, ...textareaProps }) {
  return (
    <label
      className={
        className ? `flex flex-col gap-2 ${className}` : 'flex flex-col gap-2'
      }
    >
      <span className="typography-body-sm text-[#202421]">
        {label}
        {required ? <span className="ml-1 text-[#ba1a1a]">*</span> : null}
      </span>
      <textarea
        {...textareaProps}
        className="typography-body min-h-28 rounded-[14px] border border-[#dfe5dc] bg-white px-4 py-3 text-[#202421] transition-colors outline-none placeholder:text-[#8a9187] focus:border-[#005412] focus:ring-2 focus:ring-[#005412]/10"
      />
    </label>
  );
}

function SelectField({ label, required, options, className, ...selectProps }) {
  const {
    value,
    onValueChange,
    placeholder = 'Select an option',
    allowEmptyOption = false,
    emptyOptionLabel = 'Not set',
    ...restSelectProps
  } = selectProps;
  const normalizedValue =
    allowEmptyOption && value === '' ? EMPTY_SELECT_VALUE : value;

  return (
    <div
      className={
        className ? `flex flex-col gap-2 ${className}` : 'flex flex-col gap-2'
      }
    >
      <span className="typography-body-sm text-[#202421]">
        {label}
        {required ? <span className="ml-1 text-[#ba1a1a]">*</span> : null}
      </span>
      <Select
        value={normalizedValue}
        onValueChange={(nextValue) =>
          onValueChange?.(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)
        }
        {...restSelectProps}
      >
        <SelectTrigger className="typography-body h-11 w-full rounded-[14px] border border-[#dfe5dc] bg-white px-4 text-[#202421] transition-colors outline-none focus:border-[#005412] focus:ring-2 focus:ring-[#005412]/10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmptyOption ? (
            <SelectItem value={EMPTY_SELECT_VALUE}>
              {emptyOptionLabel}
            </SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DatePickerField({
  label,
  required,
  className,
  date,
  onDateChange,
  onClear,
  clearDisabled,
}) {
  return (
    <div
      className={
        className ? `flex flex-col gap-2 ${className}` : 'flex flex-col gap-2'
      }
    >
      <span className="typography-body-sm text-[#202421]">
        {label}
        {required ? <span className="ml-1 text-[#ba1a1a]">*</span> : null}
      </span>
      <DatePicker
        date={date}
        setDate={onDateChange}
        compact
        placeholder="Pick expiry date"
        buttonClassName="h-10 rounded-[12px]"
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          className="typography-body-sm h-8 rounded-full px-2 text-[#40493d]"
          onClick={onClear}
          disabled={clearDisabled}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function formatPickerDate(dateValue) {
  if (!dateValue) {
    return undefined;
  }

  const parsedDate = parseISO(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

function getDuplicateMatchLabel(matchType) {
  switch ((matchType || '').toUpperCase()) {
    case 'BARCODE_EXACT':
      return 'Barcode exact';
    case 'NAME_EXACT':
      return 'Name exact';
    case 'NAME_POSSIBLE':
      return 'Possible duplicate';
    default:
      return 'No match';
  }
}

function InventoryNewItemPage() {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const apiBaseUrl = resolveApiBaseUrl();

  const [form, setForm] = useState(initialFormState);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [barcodeLookupError, setBarcodeLookupError] = useState('');
  const [barcodeLookupMessage, setBarcodeLookupMessage] = useState('');
  const [isBarcodeLookupLoading, setIsBarcodeLookupLoading] = useState(false);
  const [barcodeDuplicateLookup, setBarcodeDuplicateLookup] = useState(null);
  const [barcodeLookupSummary, setBarcodeLookupSummary] = useState(null);
  const expiryDateValue = formatPickerDate(form.expiryDate);

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectChange = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLookupBarcode = async () => {
    const barcode = form.barcode.trim();
    const name = form.name.trim();

    if (!apiBaseUrl) {
      setBarcodeLookupError('Could not resolve API base URL.');
      return;
    }

    if (!barcode) {
      setBarcodeLookupError('Enter a barcode before looking it up.');
      return;
    }

    setBarcodeLookupError('');
    setBarcodeLookupMessage('');
    setBarcodeDuplicateLookup(null);
    setBarcodeLookupSummary(null);
    setIsBarcodeLookupLoading(true);

    try {
      const duplicateLookup = await lookupExistingInventoryItem({
        apiUrl: apiBaseUrl,
        barcode,
        name,
        getToken: isSignedIn ? getToken : undefined,
      });

      if (duplicateLookup?.matchType && duplicateLookup.matchType !== 'NONE') {
        setBarcodeDuplicateLookup(duplicateLookup);

        if (duplicateLookup.suggestedAction === 'ADD_BATCH_TO_EXISTING') {
          setBarcodeLookupMessage(
            'An existing inventory item matches this barcode. Open it and add a batch instead of creating a new item.',
          );
          return;
        }

        if (duplicateLookup.suggestedAction === 'ASK_USER_TO_CONFIRM') {
          setBarcodeLookupMessage(
            'Possible duplicate inventory items were found. Review the matches before creating a new item.',
          );
        }
      }

      const summary = lookupToFormSummary(
        await lookupInventoryItemByBarcode({
          apiUrl: apiBaseUrl,
          barcode,
          getToken: isSignedIn ? getToken : undefined,
        }),
      );
      setBarcodeLookupSummary(summary);
      setBarcodeLookupMessage(
        'Barcode lookup completed. Fields were auto-filled where possible.',
      );

      if (summary) {
        setForm((current) => ({
          ...current,
          name: summary.name || current.name,
          brand: summary.brand || current.brand,
          imageUrl: summary.imageUrl || current.imageUrl,
          nutritionalGrade:
            summary.nutritionalGrade || current.nutritionalGrade,
          packageType: summary.packageType || current.packageType,
          ingredients: summary.ingredients || current.ingredients,
          allergensText:
            summary.allergens.length > 0
              ? summary.allergens.join(', ')
              : current.allergensText,
          tracesText:
            summary.traces.length > 0
              ? summary.traces.join(', ')
              : current.tracesText,
          unit: summary.unit || current.unit,
        }));
      }
    } catch (error) {
      setBarcodeDuplicateLookup(null);
      setBarcodeLookupError(
        describeApiFetchFailure(error, 'Could not complete barcode lookup.'),
      );
    } finally {
      setIsBarcodeLookupLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setSubmitError('Could not resolve API base URL.');
      return;
    }

    if (!form.name.trim() || !form.category || !form.unit.trim()) {
      setSubmitError('Name, category, and unit are required.');
      return;
    }

    if (form.quantity === '') {
      setSubmitError('Quantity is required for the initial batch.');
      return;
    }

    if (barcodeDuplicateLookup?.suggestedAction === 'ADD_BATCH_TO_EXISTING') {
      setSubmitError(
        'This item already exists. Open the existing inventory item and add a batch instead.',
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
      barcode: form.barcode.trim(),
      description: form.description.trim(),
      brand: form.brand.trim(),
      allergens: splitListValue(form.allergensText),
      traces: splitListValue(form.tracesText),
      ingredients: form.ingredients.trim(),
      imageUrl: form.imageUrl.trim(),
      nutritionalGrade: form.nutritionalGrade.trim(),
      reorderLevel: toOptionalNumber(form.reorderLevel),
      packageType: form.packageType.trim(),
      quantity: toOptionalNumber(form.quantity),
      expiryDate: form.expiryDate || undefined,
      supplier: form.supplier.trim(),
      unitPrice: toOptionalNumber(form.unitPrice),
      location: form.location.trim(),
      batchNote: form.batchNote.trim(),
    };

    setSubmitError('');
    setSubmitSuccess('');
    setIsSaving(true);

    try {
      const createdItem = await createInventoryItem({
        apiUrl: apiBaseUrl,
        getToken: isSignedIn ? getToken : undefined,
        payload,
      });
      const createdItemId = createdItem?._id || createdItem?.id || '';

      setSubmitSuccess('Inventory item created successfully.');

      if (createdItemId) {
        navigate(`/inventory/items/${createdItemId}`);
        return;
      }

      navigate('/inventory/items');
    } catch (error) {
      setSubmitError(
        describeApiFetchFailure(error, 'Could not create inventory item.'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setSubmitError('');
    setSubmitSuccess('');
    setBarcodeLookupError('');
    setBarcodeLookupMessage('');
    setBarcodeDuplicateLookup(null);
    setBarcodeLookupSummary(null);
  };

  return (
    <InventoryLayout
      activeItemKey="inventory"
      title="Add New Inventory Item"
      subtitle="Create a complete inventory item with its initial batch."
    >
      <div className="space-y-6 pb-16">
        <PageHero
          eyebrow="Inventory intake"
          title="Add New Inventory Item"
          description="Capture the item profile, then attach the first stock batch in the same submission."
          actionLabel="Back to items"
          actionTo="/inventory/items"
        />

        {submitError ? (
          <StatusMessage kind="error" message={submitError} />
        ) : null}
        {submitSuccess ? (
          <StatusMessage kind="success" message={submitSuccess} />
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]"
        >
          <div className="space-y-6">
            <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-1">
                  <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                    Core Details
                  </p>
                  <h2 className="typography-h1 text-[#181c1b]">Item profile</h2>
                  <p className="typography-body text-[#646b63]">
                    These fields describe the inventory item itself. Status and
                    expiry state are derived by the backend.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Item name"
                    required
                    value={form.name}
                    onChange={handleFieldChange('name')}
                    placeholder="e.g. Whole Wheat Bread"
                  />
                  <Field
                    label="Barcode"
                    value={form.barcode}
                    onChange={handleFieldChange('barcode')}
                    placeholder="Digits from the packaging"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField
                    label="Category"
                    required
                    value={form.category}
                    onValueChange={handleSelectChange('category')}
                    options={CATEGORY_OPTIONS}
                  />
                  <SelectField
                    label="Unit"
                    required
                    value={form.unit}
                    onValueChange={handleSelectChange('unit')}
                    options={UNIT_OPTIONS}
                  />
                  <Field
                    label="Brand"
                    value={form.brand}
                    onChange={handleFieldChange('brand')}
                    placeholder="Optional"
                  />
                </div>

                <TextareaField
                  label="Description"
                  value={form.description}
                  onChange={handleFieldChange('description')}
                  placeholder="Short summary of the item and how it is used."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-1">
                  <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                    Dietary & Nutrition
                  </p>
                  <h2 className="typography-h1 text-[#181c1b]">
                    Product context
                  </h2>
                  <p className="typography-body text-[#646b63]">
                    These fields help with sourcing, packaging, and food safety
                    checks.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Nutritional grade"
                    value={form.nutritionalGrade}
                    onValueChange={handleSelectChange('nutritionalGrade')}
                    allowEmptyOption
                    emptyOptionLabel="Not set"
                    placeholder="Not set"
                    options={NUTRITIONAL_GRADE_OPTIONS}
                  />
                  <Field
                    label="Reorder level"
                    type="number"
                    min="0"
                    value={form.reorderLevel}
                    onChange={handleFieldChange('reorderLevel')}
                    placeholder="10"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextareaField
                    label="Allergens"
                    value={form.allergensText}
                    onChange={handleFieldChange('allergensText')}
                    placeholder="Comma-separated list, e.g. milk, wheat"
                    rows={3}
                  />
                  <TextareaField
                    label="Traces"
                    value={form.tracesText}
                    onChange={handleFieldChange('tracesText')}
                    placeholder="Comma-separated list, e.g. nuts, soy"
                    rows={3}
                  />
                </div>

                <TextareaField
                  label="Ingredients"
                  value={form.ingredients}
                  onChange={handleFieldChange('ingredients')}
                  placeholder="Use the ingredient statement from packaging or lookup results."
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-1">
                  <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                    Logistics & Packaging
                  </p>
                  <h2 className="typography-h1 text-[#181c1b]">
                    Initial batch details
                  </h2>
                  <p className="typography-body text-[#646b63]">
                    This block creates the first batch together with the item
                    record.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Quantity"
                    required
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={handleFieldChange('quantity')}
                    placeholder="0"
                  />
                  <DatePickerField
                    label="Expiry date"
                    className="md:col-span-2"
                    date={expiryDateValue}
                    onDateChange={(date) =>
                      setForm((current) => ({
                        ...current,
                        expiryDate: date ? format(date, 'yyyy-MM-dd') : '',
                      }))
                    }
                    onClear={() =>
                      setForm((current) => ({ ...current, expiryDate: '' }))
                    }
                    clearDisabled={!form.expiryDate}
                  />
                  <Field
                    label="Supplier"
                    value={form.supplier}
                    onChange={handleFieldChange('supplier')}
                    placeholder="Optional"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Unit price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={handleFieldChange('unitPrice')}
                    placeholder="0.00"
                  />
                  <Field
                    label="Location"
                    value={form.location}
                    onChange={handleFieldChange('location')}
                    placeholder="Storage area or room"
                  />
                  <Field
                    label="Batch note"
                    value={form.batchNote}
                    onChange={handleFieldChange('batchNote')}
                    placeholder="Optional note"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Image URL"
                    value={form.imageUrl}
                    onChange={handleFieldChange('imageUrl')}
                    placeholder="Optional image link"
                  />
                </div>

                <Field
                  label="Package type"
                  value={form.packageType}
                  onChange={handleFieldChange('packageType')}
                  placeholder="Jar, box, bottle, tray..."
                />
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-1">
                  <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                    Identification
                  </p>
                  <h2 className="typography-h1 text-[#181c1b]">
                    Barcode lookup
                  </h2>
                </div>

                <p className="typography-body text-[#646b63]">
                  Check for an existing inventory item first, then use Open Food
                  Facts only when no duplicate is found.
                </p>

                <div className="typography-body rounded-[20px] border border-[#e6e9e5] bg-[#f7faf6] p-4 text-[#40493d]">
                  <p className="typography-body-sm tracking-[0.16em] text-[#005412] uppercase">
                    Current barcode
                  </p>
                  <p className="typography-body mt-1 break-all text-[#181c1b]">
                    {form.barcode.trim() ||
                      'Enter a barcode in Core Details to begin.'}
                  </p>
                </div>

                {barcodeLookupError ? (
                  <StatusMessage kind="error" message={barcodeLookupError} />
                ) : null}

                {barcodeLookupMessage ? (
                  <StatusMessage
                    kind="success"
                    message={barcodeLookupMessage}
                  />
                ) : null}

                {barcodeDuplicateLookup ? (
                  <Card className="rounded-[20px] border border-[#e6d9b8] bg-[#fff9ec] shadow-none">
                    <CardContent className="typography-body space-y-3 p-4 text-[#5b4a1d]">
                      <div className="space-y-1">
                        <p className="typography-body-sm tracking-[0.16em] text-[#8a5b00] uppercase">
                          Duplicate check
                        </p>
                        <h3 className="typography-body-lg text-[#2f2610]">
                          {getDuplicateMatchLabel(
                            barcodeDuplicateLookup.matchType,
                          )}
                        </h3>
                      </div>

                      <p>
                        {barcodeDuplicateLookup.suggestedAction ===
                        'ADD_BATCH_TO_EXISTING'
                          ? 'An existing item matches this barcode or name. Open the item to add a new batch.'
                          : 'Potential duplicate items were found. Review the matches before creating a new item.'}
                      </p>

                      {barcodeDuplicateLookup.existingItem ? (
                        <div className="rounded-[16px] border border-[#edd9a8] bg-white p-3 text-[#40493d]">
                          <p className="typography-body-sm tracking-[0.16em] text-[#8a5b00] uppercase">
                            Existing item
                          </p>
                          <p className="typography-body-lg mt-1 text-[#181c1b]">
                            {barcodeDuplicateLookup.existingItem.name}
                          </p>
                          <p className="typography-body text-[#40493d]">
                            {barcodeDuplicateLookup.existingItem.brand ||
                              'No brand recorded'}
                          </p>
                        </div>
                      ) : null}

                      {Array.isArray(barcodeDuplicateLookup.candidates) &&
                      barcodeDuplicateLookup.candidates.length > 0 ? (
                        <div className="space-y-2">
                          <p className="typography-body-sm tracking-[0.16em] text-[#8a5b00] uppercase">
                            Candidate matches
                          </p>
                          <div className="space-y-2">
                            {barcodeDuplicateLookup.candidates.map(
                              (candidate) => (
                                <div
                                  key={
                                    candidate.id ||
                                    candidate.barcode ||
                                    candidate.name
                                  }
                                  className="rounded-[14px] border border-[#edd9a8] bg-white px-3 py-2"
                                >
                                  <p className="typography-body text-[#181c1b]">
                                    {candidate.name || 'Unnamed item'}
                                  </p>
                                  <p className="typography-body-sm text-[#646b63]">
                                    {candidate.barcode || 'No barcode'} ·{' '}
                                    {candidate.status || 'Unknown status'}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      ) : null}

                      {barcodeDuplicateLookup.existingItem?.id ? (
                        <Button
                          type="button"
                          className="h-10 rounded-full bg-[#8a5b00] px-4 text-white hover:bg-[#744b00]"
                          onClick={() =>
                            navigate(
                              `/inventory/items/${barcodeDuplicateLookup.existingItem.id}`,
                            )
                          }
                        >
                          Open existing item
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                {barcodeLookupSummary ? (
                  <div className="typography-body rounded-[20px] border border-[#e6e9e5] bg-[#f7faf6] p-4 text-[#40493d]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="typography-body-sm tracking-[0.16em] text-[#005412] uppercase">
                          Lookup result
                        </p>
                        <h3 className="typography-body-lg mt-1 text-[#181c1b]">
                          {barcodeLookupSummary.name || 'Product found'}
                        </h3>
                      </div>

                      {barcodeLookupSummary.imageUrl ? (
                        <img
                          src={barcodeLookupSummary.imageUrl}
                          alt={barcodeLookupSummary.name || 'Lookup result'}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {barcodeLookupSummary.brand ? (
                        <Badge className="typography-body-sm rounded-full bg-white px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-white">
                          {barcodeLookupSummary.brand}
                        </Badge>
                      ) : null}
                      {barcodeLookupSummary.nutritionalGrade ? (
                        <Badge className="typography-body-sm rounded-full bg-white px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-white">
                          Grade{' '}
                          {barcodeLookupSummary.nutritionalGrade.toUpperCase()}
                        </Badge>
                      ) : null}
                      {barcodeLookupSummary.packageType ? (
                        <Badge className="typography-body-sm rounded-full bg-white px-2.5 py-1 tracking-widest text-[#4e544c] uppercase hover:bg-white">
                          {barcodeLookupSummary.packageType}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleLookupBarcode}
                  disabled={isBarcodeLookupLoading}
                >
                  {isBarcodeLookupLoading ? 'Looking up...' : 'Check barcode'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-[#e6e9e5] bg-white shadow-[0px_12px_28px_rgba(47,51,49,0.05)]">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-1">
                  <p className="typography-body-sm tracking-[0.2em] text-[#005412] uppercase">
                    Actions
                  </p>
                  <h2 className="typography-h1 text-[#181c1b]">
                    Save or cancel
                  </h2>
                </div>

                <p className="typography-body text-[#646b63]">
                  This submission creates the item and the first batch.
                </p>

                <div className="typography-body space-y-3 rounded-[20px] border border-[#e6e9e5] bg-[#f7faf6] p-4 text-[#40493d]">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#005412]" />
                    <p>
                      Item and batch data are sent together as one create
                      request.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#005412]" />
                    <p>
                      Lookup data is optional and only pre-fills fields when
                      available.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    className="typography-body-sm h-11 flex-1 rounded-full bg-[#005412] px-5 text-white hover:bg-[#00460f]"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save inventory item'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="typography-body-sm h-11 flex-1 rounded-full px-5"
                    onClick={handleReset}
                    disabled={isSaving}
                  >
                    Reset
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-full text-[#40493d]"
                  onClick={() => navigate('/inventory/items')}
                >
                  Cancel and return to items
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>
    </InventoryLayout>
  );
}

export default InventoryNewItemPage;
