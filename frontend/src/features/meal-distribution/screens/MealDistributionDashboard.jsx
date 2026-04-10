import {
  CheckCircle2,
  Eye,
  Pencil,
  Bell,
  Trash2,
  UserX,
  Users,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import { fetchMealAttendance, fetchMealSessions } from '../api';
import {
  FeatureSidebar,
  FeatureTopBar,
  NewSessionFloatingButton,
} from '../components';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import '../styles/meal-distribution.css';

const fallbackMealSessions = [
  { mealType: 'Lunch', planned: 60, served: 58, status: 'COMPLETED' },
  { mealType: 'Snack', planned: 50, served: 0, status: 'PLANNED' },
  { mealType: 'Breakfast', planned: 45, served: 45, status: 'COMPLETED' },
  { mealType: 'Lunch', planned: 55, served: 30, status: 'IN_PROGRESS' },
];

function buildFallbackNoShowAlerts(schoolName) {
  const school = schoolName || 'School';
  return [
    {
      id: '#10023',
      school,
      period: 'Lunch',
      count: 2,
      notified: true,
    },
    {
      id: '#10087',
      school,
      period: 'Breakfast',
      count: 1,
      notified: false,
    },
    {
      id: '#10112',
      school,
      period: 'Lunch',
      count: 3,
      notified: true,
    },
  ];
}

const statusClasses = {
  COMPLETED: 'bg-green-100 text-green-700',
  PLANNED: 'bg-zinc-100 text-zinc-500',
  IN_PROGRESS: 'bg-blue-100 text-blue-600',
};

const fallbackDonutData = [
  { label: 'Present', value: 209, colorClass: 'bg-green-500' },
  { label: 'Absent', value: 31, colorClass: 'bg-red-500' },
  { label: 'Excused', value: 18, colorClass: 'bg-blue-500' },
  { label: 'No-Show', value: 13, colorClass: 'bg-orange-500' },
];

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

export default function MealDistributionDashboard() {
  const navigate = useNavigate();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const [apiMealSessions, setApiMealSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [apiAttendance, setApiAttendance] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');
  const apiUrl = resolveApiBaseUrl();

  useEffect(() => {
    let isMounted = true;

    async function loadMealSessions() {
      if (!apiUrl || !schoolId) {
        if (isMounted) {
          setIsLoadingSessions(false);
          setSessionsError(
            !apiUrl ? 'Could not resolve API base URL (browser only).' : '',
          );
        }
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

        if (isMounted) {
          setApiMealSessions(sessions);
        }
      } catch (error) {
        if (isMounted) {
          setSessionsError(error.message || 'Failed to load meal sessions');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSessions(false);
        }
      }
    }

    loadMealSessions();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, schoolId, getToken, isSignedIn]);

  const todayDateKey = toDateKey(new Date());

  const todaySessionDocs = useMemo(
    () =>
      apiMealSessions.filter(
        (session) => toDateKey(session.date) === todayDateKey,
      ),
    [apiMealSessions, todayDateKey],
  );

  const todaySessionIds = useMemo(
    () => todaySessionDocs.map((session) => session.id).filter(Boolean),
    [todaySessionDocs],
  );

  const normalizedTodaySessions = useMemo(() => {
    const todaysSessions = todaySessionDocs.map((session) => ({
      mealType: formatMealType(session.mealType),
      planned: Number(session.plannedHeadcount || 0),
      served: Number(session.actualServedCount || 0),
      status: session.status || 'PLANNED',
    }));

    return todaysSessions.length > 0 ? todaysSessions : fallbackMealSessions;
  }, [todaySessionDocs]);
  const isUsingFallbackSessions = todaySessionDocs.length === 0;

  useEffect(() => {
    let isMounted = true;

    async function loadAttendance() {
      if (!apiUrl || todaySessionIds.length === 0) {
        if (isMounted) {
          setApiAttendance([]);
          setIsLoadingAttendance(false);
          setAttendanceError('');
        }
        return;
      }

      setIsLoadingAttendance(true);
      setAttendanceError('');

      try {
        const responses = await Promise.all(
          todaySessionIds.map((mealSessionId) =>
            fetchMealAttendance({
              apiUrl,
              mealSessionId,
              getToken: isSignedIn ? getToken : undefined,
            }),
          ),
        );

        const flattened = responses.flat();
        if (isMounted) {
          setApiAttendance(flattened);
        }
      } catch (error) {
        if (isMounted) {
          setAttendanceError(
            describeApiFetchFailure(error, 'Failed to load attendance'),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAttendance(false);
        }
      }
    }

    loadAttendance();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, todaySessionIds, getToken, isSignedIn]);

  const summaryMetrics = useMemo(() => {
    const planned = normalizedTodaySessions.reduce(
      (sum, row) => sum + Number(row.planned || 0),
      0,
    );
    const served = normalizedTodaySessions.reduce(
      (sum, row) => sum + Number(row.served || 0),
      0,
    );
    const wastage = Math.max(planned - served, 0);
    const completionRate =
      planned > 0 ? Math.round((served / planned) * 100) : 0;

    return { planned, served, wastage, completionRate };
  }, [normalizedTodaySessions]);

  const summaryCards = [
    {
      title: 'Planned Headcount',
      value: summaryMetrics.planned,
      subtitle: 'Total expected students',
      valueClass: 'text-zinc-800',
      cardClass: 'bg-white',
      titleClass: 'text-zinc-600',
      subtitleClass: 'text-zinc-500',
      icon: Users,
      iconClass: 'text-zinc-400',
    },
    {
      title: 'Meals Served',
      value: summaryMetrics.served,
      subtitle: `${summaryMetrics.completionRate}% completion rate`,
      valueClass: 'text-[#a83206]',
      cardClass: 'bg-[#fff2ec]',
      titleClass: 'text-[#5a2a1a]',
      subtitleClass: 'text-[#a83206]',
      icon: UtensilsCrossed,
      iconClass: 'text-[#f97316]',
    },
    {
      title: 'Absent / No-Show',
      value: Math.max(summaryMetrics.planned - summaryMetrics.served, 0),
      subtitle: `Includes ${Math.max(summaryMetrics.planned - summaryMetrics.served, 0)} unexcused`,
      valueClass: 'text-[#9f0519]',
      cardClass: 'bg-[#fff1f2]',
      titleClass: 'text-[#5f0f1b]',
      subtitleClass: 'text-[#b31b25]',
      icon: UserX,
      iconClass: 'text-[#ef4444]',
    },
    {
      title: 'Wastage',
      value: summaryMetrics.wastage,
      subtitle: 'Estimated meal units',
      valueClass: 'text-[#641e7a]',
      cardClass: 'bg-[#f8edff]',
      titleClass: 'text-[#5a1171]',
      subtitleClass: 'text-[#76308c]',
      icon: Trash2,
      iconClass: 'text-[#a855f7]',
    },
  ];

  const donutMetrics = useMemo(() => {
    if (apiAttendance.length === 0) {
      return {
        rate: 92,
        rows: fallbackDonutData,
        isFallback: true,
      };
    }

    const counts = {
      PRESENT: 0,
      ABSENT: 0,
      EXCUSED: 0,
      NO_SHOW: 0,
    };

    apiAttendance.forEach((item) => {
      const status = String(item.status || '').toUpperCase();
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const rate = total > 0 ? Math.round((counts.PRESENT / total) * 100) : 0;

    return {
      rate,
      rows: [
        { label: 'Present', value: counts.PRESENT, colorClass: 'bg-green-500' },
        { label: 'Absent', value: counts.ABSENT, colorClass: 'bg-red-500' },
        { label: 'Excused', value: counts.EXCUSED, colorClass: 'bg-blue-500' },
        {
          label: 'No-Show',
          value: counts.NO_SHOW,
          colorClass: 'bg-orange-500',
        },
      ],
      isFallback: false,
    };
  }, [apiAttendance]);

  const noShowAlertsMetrics = useMemo(() => {
    if (apiAttendance.length === 0) {
      return {
        rows: buildFallbackNoShowAlerts(schoolName),
        isFallback: true,
      };
    }

    const sessionMealTypeById = new Map(
      todaySessionDocs.map((session) => [
        session.id,
        formatMealType(session.mealType),
      ]),
    );

    const grouped = new Map();

    apiAttendance
      .filter((item) => String(item.status || '').toUpperCase() === 'NO_SHOW')
      .forEach((item) => {
        const studentId = item.studentId || 'Unknown';
        const period = sessionMealTypeById.get(item.mealSessionId) || '-';
        const key = `${studentId}::${period}`;
        const current = grouped.get(key) || 0;
        grouped.set(key, current + 1);
      });

    const rows = Array.from(grouped.entries()).map(([key, count]) => {
      const [studentId, period] = key.split('::');
      return {
        id: studentId.startsWith('#') ? studentId : `#${studentId}`,
        school: schoolName,
        period,
        count,
        notified: false,
      };
    });

    if (rows.length > 0) {
      return {
        rows,
        isFallback: false,
      };
    }

    return {
      rows: buildFallbackNoShowAlerts(schoolName),
      isFallback: true,
    };
  }, [apiAttendance, todaySessionDocs, schoolName]);

  return (
    <div className="meal-distribution-root min-h-screen bg-[#f6f6f6] text-zinc-900">
      <div className="mx-auto flex w-full max-w-[1536px]">
        <FeatureSidebar
          schoolName={schoolName}
          activeItem="dashboard"
          navigate={navigate}
        />

        <main className="w-[1280px] shrink-0 pt-3 pr-10 pb-8 pl-6">
          <FeatureTopBar
            title="Dashboard"
            subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Today's overview`}
            searchPlaceholder="Search sessions or students..."
          />

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={`h-40 rounded-[12px] p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] ${card.cardClass}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${card.titleClass}`}>
                      {card.title}
                    </p>
                    <Icon className={`h-5 w-5 ${card.iconClass}`} />
                  </div>
                  <p
                    className={`mt-6 text-[34px] leading-none font-bold ${card.valueClass}`}
                  >
                    {card.value}
                  </p>
                  <p
                    className={`mt-2 text-xs font-medium ${card.subtitleClass}`}
                  >
                    {card.subtitle}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid gap-8 xl:grid-cols-10">
            <article className="rounded-[12px] bg-[#f0f1f1] p-8 xl:col-span-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[20px] font-bold tracking-[-0.4px] text-zinc-800">
                  Today&apos;s Meal Sessions
                </h2>
                {isUsingFallbackSessions && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    Using fallback data
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

              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs font-medium text-zinc-500">
                      <th className="px-6 pb-2">Meal Type</th>
                      <th className="px-2 pb-2">Planned</th>
                      <th className="px-2 pb-2">Served</th>
                      <th className="px-2 pb-2 text-center">Status</th>
                      <th className="px-4 pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedTodaySessions.map((row, index) => (
                      <tr
                        key={`${row.mealType}-${row.status}-${index}`}
                        className="rounded-[12px] bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                      >
                        <td className="rounded-l-[12px] px-6 py-4 text-xs font-medium text-zinc-800">
                          {row.mealType}
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
                              className="rounded-md p-1 hover:bg-zinc-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1 hover:bg-zinc-100"
                            >
                              <Eye className="h-3.5 w-3.5" />
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
                Attendance Breakdown
              </h2>
              {donutMetrics.isFallback && (
                <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Using fallback data
                </span>
              )}
              {isLoadingAttendance && (
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  Loading attendance...
                </p>
              )}
              {attendanceError && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {attendanceError}
                </p>
              )}

              <div className="mt-8 flex justify-center">
                <div className="relative h-48 w-48 rounded-full bg-[conic-gradient(#22c55e_0_300deg,#ef4444_300deg_344deg,#3b82f6_344deg_370deg,#f97316_370deg_392deg)]">
                  <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#f0f1f1]">
                    <p className="text-[32px] font-semibold text-zinc-800">
                      {donutMetrics.rate}%
                    </p>
                    <p className="text-xs font-medium text-zinc-500">Rate</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {donutMetrics.rows.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span
                      className={`h-3 w-3 rounded-full ${item.colorClass}`}
                    />
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
                  Recent No-Show Alerts
                </h2>
                {noShowAlertsMetrics.isFallback && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                    Using fallback data
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/meal-distribution/no-show-alerts')}
                className="text-xs font-medium text-[#a83206]"
              >
                View All
              </button>
            </div>
            {isLoadingAttendance && (
              <p className="mb-4 text-xs font-medium text-zinc-500">
                Loading no-show alerts...
              </p>
            )}
            {attendanceError && (
              <p className="mb-4 text-xs font-medium text-red-600">
                {attendanceError}
              </p>
            )}

            <div className="overflow-hidden rounded-[12px] bg-white">
              <table className="w-full">
                <thead className="bg-[#e7e8e8] text-left text-xs font-medium text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Student ID</th>
                    <th className="px-6 py-4">School</th>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4 text-center">No-Show Count</th>
                    <th className="px-6 py-4">Notified Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {noShowAlertsMetrics.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-5 text-sm text-zinc-800">
                        {row.id}
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-800">
                        {row.school}
                      </td>
                      <td className="px-6 py-5 text-sm text-zinc-800">
                        {row.period}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${row.count > 2 ? 'bg-red-200 text-red-700' : row.count > 1 ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-700'}`}
                        >
                          {row.count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${row.notified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {row.notified ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {row.notified ? 'Notified' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <NewSessionFloatingButton
        onClick={() => navigate('/meal-distribution/sessions?create=1')}
      />
    </div>
  );
}
