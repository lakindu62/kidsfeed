import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { createMealSession, fetchMealSessions } from '../api';
import CardGrid from '@/components/common/CardGrid';
import MetricCard from '@/components/common/MetricCard';
import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';
import StatusMessage from '@/components/common/StatusMessage';
import MealDistributionLayout from '../layouts/MealDistributionLayout';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import { mealDistributionDateInputOverlayClassName } from '../utils/meal-distribution-layout-classes';

function formatMealType(mealType) {
  if (!mealType) return '-';
  return mealType
    .toString()
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());
}

function addDaysToDateInputValue(dateValue, daysToAdd) {
  if (!dateValue) return '';
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return '';
  baseDate.setDate(baseDate.getDate() + daysToAdd);
  return baseDate.toISOString().slice(0, 10);
}

export default function MealSessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [query, setQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createForm, setCreateForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    mealType: 'LUNCH',
  });
  const weekStartInputRef = useRef(null);
  const weekEndInputRef = useRef(null);

  const openDatePicker = (inputRef) => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  const openCreateModal = useCallback(() => {
    setCreateError('');
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    if (searchParams.get('create') === '1') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('create');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadSessions = useCallback(async () => {
    if (!apiUrl || !schoolId) {
      setError(!apiUrl ? 'Could not resolve API base URL.' : '');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchMealSessions({
        apiUrl,
        schoolId,
        getToken: isSignedIn ? getToken : undefined,
        searchParams: {
          dateFrom: weekStartDate || undefined,
          dateTo: weekEndDate || undefined,
        },
      });
      setSessions(data);
    } catch (loadError) {
      setError(
        describeApiFetchFailure(loadError, 'Failed to fetch meal sessions'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, schoolId, getToken, isSignedIn, weekStartDate, weekEndDate]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sessions.filter((item) => {
      const mealTypeMatches =
        mealTypeFilter === 'ALL' ||
        String(item.mealType || '').toUpperCase() === mealTypeFilter;
      const statusMatches =
        statusFilter === 'ALL' ||
        String(item.status || '').toUpperCase() === statusFilter;

      const queryMatches =
        !normalizedQuery ||
        String(item.date || '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(item.mealType || '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(item.status || '')
          .toLowerCase()
          .includes(normalizedQuery);

      return mealTypeMatches && statusMatches && queryMatches;
    });
  }, [sessions, mealTypeFilter, statusFilter, query]);

  const currentStats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const planned = filteredSessions.reduce(
      (sum, item) => sum + Number(item.plannedHeadcount || 0),
      0,
    );
    const served = filteredSessions.reduce(
      (sum, item) => sum + Number(item.actualServedCount || 0),
      0,
    );
    const completed = filteredSessions.filter(
      (item) => String(item.status || '').toUpperCase() === 'COMPLETED',
    ).length;
    const completionRate =
      planned > 0 ? Math.round((served / planned) * 100) : 0;

    return { totalSessions, planned, served, completed, completionRate };
  }, [filteredSessions]);

  const handleCreateSession = async (event) => {
    event.preventDefault();
    if (!createForm.date || !createForm.mealType) {
      setCreateError('Date and meal type are required.');
      return;
    }

    if (!apiUrl) {
      setCreateError('Could not resolve API base URL.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      await createMealSession({
        apiUrl,
        getToken: isSignedIn ? getToken : undefined,
        payload: {
          date: createForm.date,
          mealType: createForm.mealType,
          schoolId,
        },
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        date: new Date().toISOString().slice(0, 10),
        mealType: 'LUNCH',
      });
      setSuccessMessage('Session created successfully.');
      await loadSessions();
    } catch (submitError) {
      setCreateError(
        describeApiFetchFailure(submitError, 'Failed to create session'),
      );
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = setTimeout(() => {
      setSuccessMessage('');
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      openCreateModal();
    }
  }, [searchParams, openCreateModal]);

  return (
    <MealDistributionLayout
      activeItemKey="sessions"
      title="Meal Sessions"
      subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Create and manage sessions`}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Search by meal type, date, status..."
      breadcrumbItems={[
        { label: 'Meal Distribution', href: '/meal-distribution' },
        { label: 'Meal Sessions' },
      ]}
    >
      <section className="rounded-[12px] bg-[#f0f1f1] p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
            All Meal Sessions
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative mr-1 flex h-[34px] min-w-[122px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm"
              onClick={() => openDatePicker(weekStartInputRef)}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{weekStartDate || 'Start date'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              <input
                ref={weekStartInputRef}
                type="date"
                value={weekStartDate}
                onChange={(event) => {
                  const startDate = event.target.value;
                  setWeekStartDate(startDate);
                  setWeekEndDate(addDaysToDateInputValue(startDate, 7));
                }}
                className={mealDistributionDateInputOverlayClassName}
                aria-label="Week start date"
              />
            </button>
            <button
              type="button"
              className="relative flex h-[34px] min-w-[122px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm"
              onClick={() => openDatePicker(weekEndInputRef)}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{weekEndDate || 'End date'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              <input
                ref={weekEndInputRef}
                type="date"
                value={weekEndDate}
                onChange={(event) => setWeekEndDate(event.target.value)}
                className={mealDistributionDateInputOverlayClassName}
                aria-label="Week end date"
              />
            </button>
            <div className="flex h-[34px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm">
              <Filter className="h-4 w-4" />
              <select
                value={mealTypeFilter}
                onChange={(event) => setMealTypeFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="ALL">All Meal Types</option>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="SNACK">Snack</option>
              </select>
            </div>
            <div className="flex h-[34px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm">
              <CalendarDays className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <CardGrid
          items={[
            {
              key: 'sessions',
              label: 'Sessions (current view)',
              value: currentStats.totalSessions,
            },
            {
              key: 'planned',
              label: 'Planned meals',
              value: currentStats.planned,
            },
            {
              key: 'served',
              label: 'Meals served',
              value: currentStats.served,
            },
            {
              key: 'completed',
              label: 'Completed sessions',
              value: currentStats.completed,
            },
            {
              key: 'rate',
              label: 'Completion rate',
              value: `${currentStats.completionRate}%`,
            },
          ]}
          columnsClassName="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
          emptyMessage="No session stats available."
          renderItem={(card) => (
            <MetricCard
              key={card.key}
              value={card.value}
              label={card.label}
              className="min-h-0"
            />
          )}
        />

        <StatusMessage
          kind="info"
          message={isLoading ? 'Loading sessions...' : ''}
        />
        <StatusMessage kind="error" message={error} />

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-medium text-zinc-500">
                <th className="px-6 pb-2">Meal Type</th>
                <th className="px-2 pb-2">Date</th>
                <th className="px-2 pb-2">Menu</th>
                <th className="px-2 pb-2">Planned</th>
                <th className="px-2 pb-2">Served</th>
                <th className="px-2 pb-2">Wastage</th>
                <th className="px-2 pb-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((item) => (
                <tr
                  key={item.id}
                  className="rounded-[12px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                >
                  <td className="rounded-l-[12px] px-6 py-4 text-xs font-medium text-zinc-800">
                    {formatMealType(item.mealType)}
                  </td>
                  <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                    {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                  </td>
                  <td className="max-w-[200px] px-2 py-4">
                    {item.recipeName ? (
                      <div>
                        <p className="truncate text-xs font-semibold text-zinc-800">
                          {item.recipeName}
                        </p>
                        {item.recipeDescription && (
                          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                            {item.recipeDescription}
                          </p>
                        )}
                        {item.mealNotes && (
                          <p className="mt-0.5 truncate text-[11px] text-zinc-400 italic">
                            {item.mealNotes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-400">
                        No menu assigned
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                    {item.plannedHeadcount ?? 0}
                  </td>
                  <td className="px-2 py-4 text-xs font-medium text-[#a83206]">
                    {item.actualServedCount ?? 0}
                  </td>
                  <td className="px-2 py-4 text-xs font-medium text-[#641e7a]">
                    {item.wastageCount ?? 0}
                  </td>
                  <td className="rounded-r-[12px] px-2 py-4 text-center">
                    <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-semibold text-zinc-700">
                      {String(item.status || 'PLANNED').replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredSessions.length === 0 && (
            <p className="mt-3 text-xs font-medium text-zinc-500">
              No sessions match current filters.
            </p>
          )}
        </div>
      </section>
      <NewSessionFloatingButton onClick={openCreateModal} />

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-800">
                  Create New Session
                </h3>
                <p className="text-xs font-medium text-zinc-500">
                  {formatMealDistributionSchoolSubtitle(schoolName)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-md text-zinc-500 hover:bg-zinc-100"
                onClick={closeCreateModal}
                disabled={isCreating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateSession}>
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600">
                  Date
                </label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      date: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600">
                  Meal Type
                </label>
                <select
                  value={createForm.mealType}
                  onChange={(event) =>
                    setCreateForm((previous) => ({
                      ...previous,
                      mealType: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-green-600"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACK">Snack</option>
                </select>
              </div>

              {createError && (
                <p className="text-xs font-medium text-red-600">
                  {createError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={closeCreateModal}
                  variant="outline"
                  size="lg"
                  className="h-10 rounded-lg border-zinc-200 px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="h-10 rounded-lg bg-[#116e20] px-4 text-sm font-semibold text-white hover:bg-[#0f5e1c] disabled:opacity-70"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed right-8 bottom-24 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {successMessage}
        </div>
      )}
    </MealDistributionLayout>
  );
}
