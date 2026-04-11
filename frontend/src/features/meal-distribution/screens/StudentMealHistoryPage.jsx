import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import { fetchStudentMealHistory } from '../api';
import { FeatureSidebar, FeatureTopBar } from '../components';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import { mealDistributionRootClassName } from '../utils/meal-distribution-layout-classes';

function formatMealType(mealType) {
  if (!mealType) return '-';
  return mealType
    .toString()
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());
}

export default function StudentMealHistoryPage() {
  const navigate = useNavigate();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [mealType, setMealType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [query, setQuery] = useState('');
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);

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

  const loadHistory = useCallback(async () => {
    if (!apiUrl || !schoolId || !studentIdInput.trim()) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await fetchStudentMealHistory({
        apiUrl,
        schoolId,
        studentId: studentIdInput.trim(),
        getToken: isSignedIn ? getToken : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        mealType: mealType || undefined,
        attendanceStatus: attendanceStatus || undefined,
      });
      setRows(data);
    } catch (loadError) {
      setError(
        describeApiFetchFailure(
          loadError,
          'Failed to load student meal history',
        ),
      );
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    apiUrl,
    schoolId,
    studentIdInput,
    getToken,
    isSignedIn,
    dateFrom,
    dateTo,
    mealType,
    attendanceStatus,
  ]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
        String(row.attendanceStatus || '')
          .toLowerCase()
          .includes(q),
    );
  }, [rows, query]);

  const summary = useMemo(() => {
    const counts = { PRESENT: 0, EXCUSED: 0, NO_SHOW: 0 };
    filteredRows.forEach((row) => {
      const status = String(row.attendanceStatus || '').toUpperCase();
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return {
      total: filteredRows.length,
      present: counts.PRESENT,
      excused: counts.EXCUSED,
      noShow: counts.NO_SHOW,
    };
  }, [filteredRows]);

  return (
    <div className={mealDistributionRootClassName}>
      <div className="mx-auto flex w-full max-w-[1536px]">
        <FeatureSidebar
          schoolName={schoolName}
          activeItem="studentHistory"
          navigate={navigate}
        />

        <main className="w-[1280px] shrink-0 pt-3 pr-10 pb-8 pl-6">
          <FeatureTopBar
            title="Student Meal History"
            subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Per-student meal sessions`}
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search in loaded history..."
          />

          <section className="rounded-[12px] bg-[#f0f1f1] p-8">
            <div className="mb-4 grid gap-3 md:grid-cols-5">
              <input
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                placeholder="Student ID (required)"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-green-600"
              />
              <select
                value={attendanceStatus}
                onChange={(event) => setAttendanceStatus(event.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none"
              >
                <option value="">All attendance status</option>
                <option value="PRESENT">Present</option>
                <option value="EXCUSED">Excused</option>
                <option value="NO_SHOW">No-Show</option>
              </select>
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
                className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none"
              >
                <option value="">All meal types</option>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="SNACK">Snack</option>
              </select>
              <button
                type="button"
                onClick={() => openDatePicker(dateFromRef)}
                className="relative flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <CalendarDays className="h-4 w-4" />
                <span>{dateFrom || 'Start date'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                <input
                  ref={dateFromRef}
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </button>
              <button
                type="button"
                onClick={() => openDatePicker(dateToRef)}
                className="relative flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
              >
                <CalendarDays className="h-4 w-4" />
                <span>{dateTo || 'End date'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                <input
                  ref={dateToRef}
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </button>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-zinc-800">
                Total sessions: {summary.total}
              </div>
              <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-green-700">
                Present: {summary.present}
              </div>
              <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-blue-700">
                Excused: {summary.excused}
              </div>
              <div className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-red-700">
                No-Show: {summary.noShow}
              </div>
            </div>

            {isLoading && (
              <p className="mb-4 text-xs font-medium text-zinc-500">
                Loading student history...
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
                    <th className="px-2 pb-2">Name</th>
                    <th className="px-2 pb-2">Session date</th>
                    <th className="px-2 pb-2">Meal</th>
                    <th className="px-2 pb-2">Session status</th>
                    <th className="px-2 pb-2">Attendance</th>
                    <th className="px-2 pb-2">Served at</th>
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
                        {row.studentName || '-'}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                        {row.sessionDate
                          ? new Date(row.sessionDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-800">
                        {formatMealType(row.mealType)}
                      </td>
                      <td className="px-2 py-4 text-xs font-medium text-zinc-700">
                        {String(row.sessionStatus || '').replace('_', ' ')}
                      </td>
                      <td className="px-2 py-4 text-xs font-semibold text-zinc-800">
                        {String(row.attendanceStatus || '').replace('_', ' ')}
                      </td>
                      <td className="rounded-r-[12px] px-2 py-4 text-xs font-medium text-zinc-700">
                        {row.servedAt
                          ? new Date(row.servedAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isLoading && !studentIdInput.trim() && (
                <p className="mt-3 text-xs font-medium text-zinc-500">
                  Enter a student ID to load meal session history.
                </p>
              )}
              {!isLoading &&
                studentIdInput.trim() &&
                filteredRows.length === 0 && (
                  <p className="mt-3 text-xs font-medium text-zinc-500">
                    No records found for this student and filters.
                  </p>
                )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
