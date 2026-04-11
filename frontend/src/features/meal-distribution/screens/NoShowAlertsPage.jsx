import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import { fetchNoShowAlerts } from '../api';
import { FeatureSidebar, FeatureTopBar } from '../components';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import {
  mealDistributionDateInputOverlayClassName,
  mealDistributionRootClassName,
} from '../utils/meal-distribution-layout-classes';

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

function emailStatusLabel(row) {
  if (!row.emailLogStatus) return '—';
  const base = row.emailLogStatus;
  if (row.emailLogSkipReason) {
    return `${base} (${row.emailLogSkipReason})`;
  }
  return base;
}

export default function NoShowAlertsPage() {
  const navigate = useNavigate();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [query, setQuery] = useState('');
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

  const loadAlerts = useCallback(async () => {
    if (!apiUrl || !schoolId) {
      setError(!apiUrl ? 'Missing VITE_API_URL in frontend/.env' : '');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchNoShowAlerts({
        apiUrl,
        schoolId,
        getToken: isSignedIn ? getToken : undefined,
        dateFrom: weekStartDate || undefined,
        dateTo: weekEndDate || undefined,
      });
      setRows(data);
    } catch (loadError) {
      setError(
        describeApiFetchFailure(loadError, 'Failed to load no-show alerts'),
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, schoolId, getToken, isSignedIn, weekStartDate, weekEndDate]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        String(row.studentId || '')
          .toLowerCase()
          .includes(q) ||
        String(row.mealType || '')
          .toLowerCase()
          .includes(q) ||
        String(row.emailLogStatus || '')
          .toLowerCase()
          .includes(q),
    );
  }, [rows, query]);

  return (
    <div className={mealDistributionRootClassName}>
      <div className="mx-auto flex w-full max-w-[1536px]">
        <FeatureSidebar
          schoolName={schoolName}
          activeItem="noShowAlerts"
          navigate={navigate}
        />

        <main className="w-[1280px] shrink-0 pt-3 pr-10 pb-8 pl-6">
          <FeatureTopBar
            title="No-Show Alerts"
            subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Absent and no-show records`}
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search by student ID, meal type, email status..."
          />

          <section className="rounded-[12px] bg-[#f0f1f1] p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
                All no-show &amp; absent records
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="relative mr-1 flex h-[34px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm"
                  onClick={() => openDatePicker(weekStartInputRef)}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="truncate">
                    {weekStartDate || 'Start date'}
                  </span>
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
                    aria-label="Range start date"
                  />
                </button>
                <button
                  type="button"
                  className="relative flex h-[34px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 shadow-sm"
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
                    aria-label="Range end date"
                  />
                </button>
              </div>
            </div>

            {isLoading && (
              <p className="mb-4 text-xs font-medium text-zinc-500">
                Loading alerts...
              </p>
            )}
            {error && (
              <p className="mb-4 text-xs font-medium text-red-600">{error}</p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-medium text-zinc-500">
                    <th className="px-6 pb-2">Student ID</th>
                    <th className="px-2 pb-2">Session date</th>
                    <th className="px-2 pb-2">Meal</th>
                    <th className="px-2 pb-2">Attendance</th>
                    <th className="px-2 pb-2">Session</th>
                    <th className="px-2 pb-2">Guardian email</th>
                    <th className="px-2 pb-2">Guardian email log</th>
                    <th className="px-2 pb-2">Sent at</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={
                        row.attendanceId ||
                        `${row.mealSessionId}-${row.studentId}`
                      }
                      className="rounded-[12px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                    >
                      <td className="rounded-l-[12px] px-6 py-4 text-xs font-medium text-zinc-800">
                        {row.studentId}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                        {row.sessionDate
                          ? new Date(row.sessionDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                        {formatMealType(row.mealType)}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-[#9f0519]">
                        {String(row.attendanceStatus || '').replace('_', ' ')}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-600">
                        {String(row.sessionStatus || '').replace('_', ' ')}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-700">
                        {row.guardianEmail || '—'}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-700">
                        {emailStatusLabel(row)}
                      </td>
                      <td className="rounded-r-[12px] px-2 py-4 text-xs font-medium text-zinc-600">
                        {row.emailSentAt
                          ? new Date(row.emailSentAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isLoading && filteredRows.length === 0 && (
                <p className="mt-3 text-xs font-medium text-zinc-500">
                  No no-show or absent records for this range. Clear dates to
                  load all sessions for your school.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
