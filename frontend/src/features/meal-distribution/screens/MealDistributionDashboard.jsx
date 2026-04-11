import { Pencil, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import {
  deleteMealSession,
  fetchNoShowAlerts,
  fetchMealSessions,
} from '../api';
import NewSessionFloatingButton from '@/components/common/NewSessionFloatingButton';
import MealDistributionLayout from '../layouts/MealDistributionLayout';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
  useCountUp,
} from '../hooks';

const statusClasses = {
  COMPLETED: 'bg-green-100 text-green-700',
  PLANNED: 'bg-zinc-100 text-zinc-500',
  IN_PROGRESS: 'bg-blue-100 text-blue-600',
};

function toDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatMealType(mealType) {
  if (!mealType) return '-';
  return mealType
    .toString()
    .toLowerCase()
    .replace(/^\w/, (match) => match.toUpperCase());
}

/** Inclusive calendar range for the last 7 days ending today (local). */
function getRollingWeekDateKeys() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { dateFrom: toDateKey(start), dateTo: toDateKey(end) };
}

function formatWeekRangeSubtitle(dateFrom, dateTo) {
  const a = new Date(`${dateFrom}T12:00:00`);
  const b = new Date(`${dateTo}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
  const opts = { month: 'short', day: 'numeric' };
  const left = a.toLocaleDateString(undefined, opts);
  const right = b.toLocaleDateString(undefined, opts);
  return `${left} – ${right}`;
}

export default function MealDistributionDashboard() {
  const navigate = useNavigate();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const [apiMealSessions, setApiMealSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [todayNoShowRows, setTodayNoShowRows] = useState([]);
  const [isLoadingNoShowLogs, setIsLoadingNoShowLogs] = useState(true);
  const [noShowLogsError, setNoShowLogsError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState('');
  const [weekNoShowCount, setWeekNoShowCount] = useState(null);
  const [weekNoShowError, setWeekNoShowError] = useState('');
  const apiUrl = resolveApiBaseUrl();

  const loadMealSessions = useCallback(async () => {
    if (!apiUrl || !schoolId) {
      setIsLoadingSessions(false);
      setSessionsError(
        !apiUrl ? 'Could not resolve API base URL (browser only).' : '',
      );
      return;
    }

    setIsLoadingSessions(true);
    setSessionsError('');

    try {
      const sessions = await fetchMealSessions({
        apiUrl,
        schoolId,
        getToken: isSignedIn ? getToken : undefined,
      });
      setApiMealSessions(sessions);
    } catch (error) {
      setSessionsError(error.message || 'Failed to load meal sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [apiUrl, schoolId, getToken, isSignedIn]);

  useEffect(() => {
    loadMealSessions();
  }, [loadMealSessions]);

  const todayDateKey = toDateKey(new Date());

  const todaySessionDocs = useMemo(
    () =>
      apiMealSessions.filter(
        (session) => toDateKey(session.date) === todayDateKey,
      ),
    [apiMealSessions, todayDateKey],
  );

  const normalizedTodaySessions = useMemo(() => {
    return todaySessionDocs.map((session) => ({
      id: session.id,
      mealType: formatMealType(session.mealType),
      planned: Number(session.plannedHeadcount || 0),
      served: Number(session.actualServedCount || 0),
      status: session.status || 'PLANNED',
      recipeName: session.recipeName || null,
    }));
  }, [todaySessionDocs]);
  const isUsingFallbackSessions = todaySessionDocs.length === 0;

  const sessionMixMetrics = useMemo(() => {
    if (todaySessionDocs.length === 0) {
      return {
        focusRate: 0,
        rows: [
          { label: 'Planned', value: 0, colorClass: 'bg-zinc-400' },
          {
            label: 'In Progress',
            value: 0,
            colorClass: 'bg-blue-500',
          },
          {
            label: 'Completed',
            value: 0,
            colorClass: 'bg-green-500',
          },
        ],
        isFallback: true,
      };
    }

    const counts = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    todaySessionDocs.forEach((session) => {
      const status = String(session.status || 'PLANNED').toUpperCase();
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const completionRate =
      total > 0 ? Math.round((counts.COMPLETED / total) * 100) : 0;

    return {
      focusRate: completionRate,
      rows: [
        { label: 'Planned', value: counts.PLANNED, colorClass: 'bg-zinc-400' },
        {
          label: 'In Progress',
          value: counts.IN_PROGRESS,
          colorClass: 'bg-blue-500',
        },
        {
          label: 'Completed',
          value: counts.COMPLETED,
          colorClass: 'bg-green-500',
        },
      ],
      isFallback: false,
    };
  }, [todaySessionDocs]);

  const sessionMixConicBackground = useMemo(() => {
    const rows = sessionMixMetrics.rows;
    const total = rows.reduce((sum, row) => sum + Number(row.value || 0), 0);
    if (!total) {
      return 'conic-gradient(#d4d4d8 0deg 360deg)';
    }

    const palette = {
      Planned: '#a1a1aa',
      'In Progress': '#3b82f6',
      Completed: '#22c55e',
    };

    let cursor = 0;
    const slices = rows
      .map((row) => {
        const angle = (Number(row.value || 0) / total) * 360;
        const start = cursor;
        const end = cursor + angle;
        cursor = end;
        const color = palette[row.label] || '#d4d4d8';
        return `${color} ${start}deg ${end}deg`;
      })
      .join(', ');

    return `conic-gradient(${slices})`;
  }, [sessionMixMetrics.rows]);

  useEffect(() => {
    let isMounted = true;

    async function loadTodayNoShowLogs() {
      if (!apiUrl || !schoolId) {
        if (isMounted) {
          setTodayNoShowRows([]);
          setIsLoadingNoShowLogs(false);
          setNoShowLogsError('');
        }
        return;
      }

      setIsLoadingNoShowLogs(true);
      setNoShowLogsError('');
      try {
        const data = await fetchNoShowAlerts({
          apiUrl,
          schoolId,
          getToken: isSignedIn ? getToken : undefined,
          dateFrom: todayDateKey,
          dateTo: todayDateKey,
        });
        if (isMounted) {
          setTodayNoShowRows(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setNoShowLogsError(
            describeApiFetchFailure(error, 'Failed to load today no-show logs'),
          );
          setTodayNoShowRows([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingNoShowLogs(false);
        }
      }
    }

    loadTodayNoShowLogs();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, schoolId, todayDateKey, getToken, isSignedIn]);

  const rollingWeek = useMemo(() => getRollingWeekDateKeys(), [todayDateKey]);

  const weeklyKpis = useMemo(() => {
    const { dateFrom, dateTo } = rollingWeek;
    let sessionCount = 0;
    let plannedTotal = 0;
    let servedTotal = 0;
    let completedCount = 0;

    apiMealSessions.forEach((session) => {
      const k = toDateKey(session.date);
      if (!k || k < dateFrom || k > dateTo) return;
      sessionCount += 1;
      plannedTotal += Number(session.plannedHeadcount || 0);
      servedTotal += Number(session.actualServedCount || 0);
      if (String(session.status || '').toUpperCase() === 'COMPLETED') {
        completedCount += 1;
      }
    });

    const serveRatePct =
      plannedTotal > 0 ? Math.round((servedTotal / plannedTotal) * 100) : null;
    const completedPct =
      sessionCount > 0
        ? Math.round((completedCount / sessionCount) * 100)
        : null;

    return {
      dateFrom,
      dateTo,
      rangeSubtitle: formatWeekRangeSubtitle(dateFrom, dateTo),
      sessionCount,
      plannedTotal,
      servedTotal,
      completedCount,
      serveRatePct,
      completedPct,
    };
  }, [apiMealSessions, rollingWeek]);

  useEffect(() => {
    let isMounted = true;

    async function loadWeekNoShows() {
      if (!apiUrl || !schoolId) {
        if (isMounted) {
          setWeekNoShowCount(0);
          setWeekNoShowError('');
        }
        return;
      }

      setWeekNoShowError('');
      setWeekNoShowCount(null);

      try {
        const data = await fetchNoShowAlerts({
          apiUrl,
          schoolId,
          getToken: isSignedIn ? getToken : undefined,
          dateFrom: rollingWeek.dateFrom,
          dateTo: rollingWeek.dateTo,
        });
        if (isMounted) {
          setWeekNoShowCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        if (isMounted) {
          setWeekNoShowError(
            describeApiFetchFailure(
              error,
              'Could not load no-show count for this week',
            ),
          );
          setWeekNoShowCount(null);
        }
      }
    }

    loadWeekNoShows();

    return () => {
      isMounted = false;
    };
  }, [
    apiUrl,
    schoolId,
    rollingWeek.dateFrom,
    rollingWeek.dateTo,
    getToken,
    isSignedIn,
  ]);

  const kpiSessions = useCountUp(weeklyKpis.sessionCount);
  const kpiCompleted = useCountUp(weeklyKpis.completedCount);
  const kpiCompletedPct = useCountUp(weeklyKpis.completedPct ?? 0, {
    enabled: weeklyKpis.completedPct != null,
  });
  const kpiPlanned = useCountUp(weeklyKpis.plannedTotal);
  const kpiServed = useCountUp(weeklyKpis.servedTotal);
  const kpiServeRate = useCountUp(weeklyKpis.serveRatePct ?? 0, {
    enabled: weeklyKpis.serveRatePct != null,
  });
  const kpiNoShow = useCountUp(weekNoShowCount ?? 0, {
    enabled: weekNoShowCount !== null,
  });

  const handleEditSession = (mealSessionId) => {
    navigate(`/meal-distribution/attendance?sessionId=${mealSessionId}`);
  };

  const handleDeleteSession = async (mealSessionId) => {
    if (!mealSessionId || !apiUrl) return;
    const shouldDelete = window.confirm(
      'Delete this meal session? This action cannot be undone.',
    );
    if (!shouldDelete) return;

    setDeleteError('');
    setDeletingSessionId(mealSessionId);
    try {
      await deleteMealSession({
        apiUrl,
        mealSessionId,
        getToken: isSignedIn ? getToken : undefined,
      });
      await loadMealSessions();
    } catch (error) {
      setDeleteError(
        describeApiFetchFailure(error, 'Failed to delete meal session'),
      );
    } finally {
      setDeletingSessionId('');
    }
  };

  return (
    <MealDistributionLayout
      activeItemKey="dashboard"
      title="Dashboard"
      subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Today's overview`}
      searchPlaceholder="Search sessions or students..."
    >
      <section className="rounded-[12px] bg-[#f0f1f1] p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
              Last 7 days at a glance
            </h2>
            <p className="mt-1 max-w-xl text-xs font-medium text-zinc-500">
              {weeklyKpis.rangeSubtitle
                ? `${weeklyKpis.rangeSubtitle} · meal sessions for this school`
                : 'Rolling week summary'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/meal-distribution/reports')}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Open reports
          </button>
        </div>

        {weekNoShowError && (
          <p className="mb-4 text-xs font-medium text-amber-700">
            {weekNoShowError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <article className="animate-md-kpi-card rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] delay-0 motion-reduce:animate-none">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Sessions
            </p>
            <p className="mt-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-3xl font-bold text-zinc-900 tabular-nums">
              {kpiSessions}
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              {kpiCompleted} completed
              {weeklyKpis.completedPct != null ? ` · ${kpiCompletedPct}%` : ''}
            </p>
          </article>

          <article className="animate-md-kpi-card rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] delay-[55ms] motion-reduce:animate-none">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Planned headcount
            </p>
            <p className="mt-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-3xl font-bold text-zinc-900 tabular-nums">
              {kpiPlanned}
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Sum across sessions
            </p>
          </article>

          <article className="animate-md-kpi-card rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] delay-[110ms] motion-reduce:animate-none">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Recorded served
            </p>
            <p className="mt-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-3xl font-bold text-[#14532d] tabular-nums">
              {kpiServed}
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              From session &quot;actual served&quot; field
            </p>
          </article>

          <article className="animate-md-kpi-card rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] delay-[165ms] motion-reduce:animate-none">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Served vs planned
            </p>
            <p className="mt-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-3xl font-bold text-zinc-900 tabular-nums">
              {weeklyKpis.serveRatePct != null ? `${kpiServeRate}%` : '—'}
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Aggregate for the week
            </p>
          </article>

          <article className="animate-md-kpi-card rounded-xl border border-zinc-200/80 bg-white p-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] delay-[220ms] motion-reduce:animate-none">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              No-show records
            </p>
            <p className="mt-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-3xl font-bold text-zinc-900 tabular-nums">
              {weekNoShowCount === null ? '…' : kpiNoShow}
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Same date range as above
            </p>
          </article>
        </div>
      </section>

      <section className="mt-6 grid gap-8 xl:grid-cols-10">
        <article className="rounded-[12px] bg-[#f0f1f1] p-8 xl:col-span-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
              Today&apos;s Meal Sessions
            </h2>
            {isUsingFallbackSessions && (
              <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                No sessions for today
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('/meal-distribution/sessions')}
              className="text-xs font-medium text-[#a83206]"
            >
              View All
            </button>
          </div>
          {isLoadingSessions && (
            <p className="mb-4 text-xs font-medium text-zinc-500">
              Loading sessions...
            </p>
          )}
          {sessionsError && (
            <p className="mb-4 text-xs font-medium text-red-600">
              {sessionsError}
            </p>
          )}
          {deleteError && (
            <p className="mb-4 text-xs font-medium text-red-600">
              {deleteError}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-medium text-zinc-500">
                  <th className="px-6 pb-2">Meal Type</th>
                  <th className="px-2 pb-2">Menu</th>
                  <th className="px-2 pb-2">Planned</th>
                  <th className="px-2 pb-2">Served</th>
                  <th className="px-2 pb-2 text-center">Status</th>
                  <th className="px-4 pb-2" />
                </tr>
              </thead>
              <tbody>
                {normalizedTodaySessions.length === 0 && (
                  <tr className="rounded-[12px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                    <td
                      colSpan={6}
                      className="rounded-[12px] px-6 py-6 text-center text-sm font-medium text-zinc-500"
                    >
                      No meal sessions for today yet.
                    </td>
                  </tr>
                )}
                {normalizedTodaySessions.map((row, index) => (
                  <tr
                    key={`${row.mealType}-${row.status}-${index}`}
                    className="rounded-[12px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                  >
                    <td className="rounded-l-[12px] px-6 py-4 text-xs font-medium text-zinc-800">
                      {row.mealType}
                    </td>
                    <td className="max-w-[160px] px-2 py-4">
                      {row.recipeName ? (
                        <span className="truncate text-xs font-medium text-zinc-700">
                          {row.recipeName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                      {row.planned}
                    </td>
                    <td
                      className={`px-2 py-4 text-xs font-medium ${row.served > 0 ? 'text-[#a83206]' : 'text-zinc-400'}`}
                    >
                      {row.served}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${statusClasses[row.status]}`}
                      >
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="rounded-r-[12px] px-4 py-4">
                      <div className="flex items-center justify-end gap-2 text-zinc-400">
                        <button
                          type="button"
                          onClick={() => handleEditSession(row.id)}
                          className="rounded-md p-1 hover:bg-zinc-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(row.id)}
                          disabled={!row.id || deletingSessionId === row.id}
                          className="rounded-md p-1 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[12px] bg-[#f0f1f1] p-8 xl:col-span-4">
          <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
            Session Status Mix
          </h2>
          {sessionMixMetrics.isFallback && (
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
              No sessions for today
            </span>
          )}
          {isLoadingSessions && (
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Loading session mix...
            </p>
          )}
          {sessionsError && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {sessionsError}
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <div
              className="relative h-48 w-48 rounded-full"
              style={{ background: sessionMixConicBackground }}
            >
              <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#f0f1f1]">
                <p className="text-[32px] font-semibold text-zinc-800">
                  {sessionMixMetrics.focusRate}%
                </p>
                <p className="text-xs font-medium text-zinc-500">Completed</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {sessionMixMetrics.rows.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${item.colorClass}`} />
                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    {item.label}
                  </p>
                  <p className="text-xs font-medium text-zinc-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-[12px] bg-[#f0f1f1] p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Bell className="h-5 w-5 text-[#b31b25]" />
            <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
              Today&apos;s No-Show Alerts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/meal-distribution/no-show-alerts')}
            className="text-xs font-medium text-[#a83206]"
          >
            View All
          </button>
        </div>
        {isLoadingNoShowLogs && (
          <p className="mb-4 text-xs font-medium text-zinc-500">
            Loading no-show alerts...
          </p>
        )}
        {noShowLogsError && (
          <p className="mb-4 text-xs font-medium text-red-600">
            {noShowLogsError}
          </p>
        )}

        <div className="overflow-hidden rounded-[12px] bg-white">
          <table className="w-full">
            <thead className="bg-[#e7e8e8] text-left text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Meal</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Guardian email</th>
                <th className="px-6 py-4">Email log</th>
                <th className="px-6 py-4">Sent at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {todayNoShowRows.map((row) => (
                <tr
                  key={
                    row.attendanceId || `${row.mealSessionId}-${row.studentId}`
                  }
                >
                  <td className="px-6 py-5 text-sm text-zinc-800">
                    {row.studentId}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-800">
                    {formatMealType(row.mealType)}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-800">
                    {String(row.attendanceStatus || '').replace('_', ' ')}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-800">
                    {row.guardianEmail || '—'}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-700">
                    {row.emailLogStatus
                      ? `${row.emailLogStatus}${row.emailLogSkipReason ? ` (${row.emailLogSkipReason})` : ''}`
                      : '—'}
                  </td>
                  <td className="px-6 py-5 text-sm text-zinc-700">
                    {row.emailSentAt
                      ? new Date(row.emailSentAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {!isLoadingNoShowLogs && todayNoShowRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-sm text-zinc-500"
                  >
                    No no-show alerts for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <NewSessionFloatingButton
        onClick={() => navigate('/meal-distribution/sessions?create=1')}
      />
    </MealDistributionLayout>
  );
}
