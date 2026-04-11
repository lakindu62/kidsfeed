import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import { downloadMealDistributionReportPdf, fetchMealSessions } from '../api';
import MealDistributionLayout from '../layouts/MealDistributionLayout';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import { mealPrimaryButtonClass } from '../utils/meal-primary-button-classes';

function shiftDateIso(isoDate, days) {
  const base = new Date(isoDate);
  if (Number.isNaN(base.getTime())) return '';
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function formatMealType(mealType) {
  if (!mealType) return '-';
  return mealType
    .toString()
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());
}

function toDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function MealReportsPage() {
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultFrom = useMemo(() => shiftDateIso(today, -30), [today]);

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(today);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingKey, setDownloadingKey] = useState('');

  const loadSessions = useCallback(async () => {
    if (!apiUrl || !schoolId) {
      setSessions([]);
      return;
    }
    setSessionsLoading(true);
    try {
      const list = await fetchMealSessions({
        apiUrl,
        schoolId,
        getToken: isSignedIn ? getToken : undefined,
        searchParams: {},
      });
      setSessions(Array.isArray(list) ? list : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [apiUrl, schoolId, getToken, isSignedIn]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const sessionOptions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const db = new Date(b.date || 0).getTime();
      const da = new Date(a.date || 0).getTime();
      return db - da;
    });
  }, [sessions]);

  const runDownload = async (key, params) => {
    if (!apiUrl || !schoolId) {
      setDownloadError(
        !apiUrl
          ? 'Could not resolve API base URL.'
          : 'School scope is not set.',
      );
      return;
    }
    setDownloadError('');
    setDownloadingKey(key);
    try {
      await downloadMealDistributionReportPdf({
        apiUrl,
        schoolId,
        getToken: isSignedIn ? getToken : undefined,
        ...params,
      });
    } catch (err) {
      setDownloadError(describeApiFetchFailure(err, 'Could not download PDF'));
    } finally {
      setDownloadingKey('');
    }
  };

  return (
    <MealDistributionLayout
      activeItemKey="reports"
      title="Reports"
      subtitle={formatMealDistributionSchoolSubtitle(schoolName)}
      searchPlaceholder=""
    >
      <section className="mb-6 rounded-[12px] border border-zinc-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">Date range</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Applied to session summary and no-show PDFs. Leave empty to include
          all dates (backend default).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="mt-5 h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Clear range (all dates)
          </button>
        </div>
      </section>

      {downloadError ? (
        <p className="mb-4 text-sm font-medium text-red-600">{downloadError}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[12px] border border-zinc-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">
            Session attendance summary
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            One row per meal session: planned headcount, served count, and
            attendance totals (present, excused, no-show).
          </p>
          <button
            type="button"
            disabled={!!downloadingKey}
            onClick={() =>
              runDownload('summary', {
                report: 'sessionSummary',
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              })
            }
            className={cn(mealPrimaryButtonClass, 'mt-4 w-fit')}
          >
            <FileDown className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">
              {downloadingKey === 'summary' ? 'Preparing…' : 'Download PDF'}
            </span>
          </button>
        </article>

        <article className="rounded-[12px] border border-zinc-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">
            No-show report
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Lists no-show rows with student name, guardian email, and email
            notification status for the selected range.
          </p>
          <button
            type="button"
            disabled={!!downloadingKey}
            onClick={() =>
              runDownload('noshow', {
                report: 'noShows',
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              })
            }
            className={cn(mealPrimaryButtonClass, 'mt-4 w-fit')}
          >
            <FileDown className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">
              {downloadingKey === 'noshow' ? 'Preparing…' : 'Download PDF'}
            </span>
          </button>
        </article>

        <article className="rounded-[12px] border border-zinc-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-800">
            Session roster
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Full roster for one session with current attendance status (same
            logic as mark attendance).
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-medium text-zinc-600">
              Meal session
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={sessionsLoading}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none"
              >
                <option value="">
                  {sessionsLoading ? 'Loading sessions…' : 'Select a session'}
                </option>
                {sessionOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {toDateKey(s.date)} · {formatMealType(s.mealType)} ·{' '}
                    {s.status || '—'}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!!downloadingKey || !selectedSessionId}
              onClick={() =>
                runDownload('roster', {
                  report: 'sessionRoster',
                  mealSessionId: selectedSessionId,
                })
              }
              className={cn(mealPrimaryButtonClass, 'w-fit')}
            >
              <FileDown className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">
                {downloadingKey === 'roster' ? 'Preparing…' : 'Download PDF'}
              </span>
            </button>
          </div>
        </article>
      </div>
    </MealDistributionLayout>
  );
}
