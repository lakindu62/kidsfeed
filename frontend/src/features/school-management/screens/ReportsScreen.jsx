import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Search,
  Download,
  Users,
  CheckCircle,
  QrCode,
  School,
} from 'lucide-react';
import SchoolManagementLayout from '../layouts/SchoolManagementLayout';
import {
  fetchDashboardOverview,
  fetchSchools,
  fetchSchoolStats,
  globalSearch,
  exportDistrictReport,
} from '../api';

function StatCard({ label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[#e2e8f0] bg-white px-6 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0fdf4]">
        {/* <Icon className="h-5 w-5 text-[#006117]" /> */}
      </div>
      <div>
        <p className="typography-h2 text-[#0f172a]">{value ?? '—'}</p>
        <p className="typography-body-sm text-[#64748b]">{label}</p>
      </div>
    </div>
  );
}

export default function ReportsScreen() {
  const { getToken } = useAuth();

  const [overview, setOverview] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolStats, setSchoolStats] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [exporting, setExporting] = useState(false);

  // Load overview + schools on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setOverviewLoading(true);
        setOverviewError(null);
        const [overviewData, schoolsData] = await Promise.all([
          fetchDashboardOverview({ getToken }).catch(() => null),
          fetchSchools({ getToken }),
        ]);
        if (!cancelled) {
          setOverview(overviewData);
          setSchools(schoolsData ?? []);
        }
      } catch (err) {
        if (!cancelled) setOverviewError(err.message ?? 'Failed to load data');
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  // Load per-school stats when school selected
  useEffect(() => {
    if (!selectedSchoolId) {
      setSchoolStats(null);
      return;
    }
    let cancelled = false;

    async function loadStats() {
      try {
        setStatsLoading(true);
        const data = await fetchSchoolStats({
          getToken,
          schoolId: selectedSchoolId,
        });
        if (!cancelled) setSchoolStats(data);
      } catch {
        if (!cancelled) setSchoolStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [getToken, selectedSchoolId]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const data = await globalSearch({ getToken, q: searchQuery.trim() });
      setSearchResults(data);
    } catch (err) {
      setSearchError(err.message ?? 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleExportReport() {
    if (!selectedSchoolId) return;
    setExporting(true);
    try {
      const res = await exportDistrictReport({
        getToken,
        schoolId: selectedSchoolId,
      });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'district-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message ?? 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const eligiblePct =
    overview?.totalStudents > 0
      ? Math.round(
          ((overview.eligibleCount ?? 0) / overview.totalStudents) * 100,
        )
      : 0;

  const schoolStatEligiblePct =
    schoolStats?.totalStudents > 0
      ? Math.round(
          ((schoolStats.eligibleCount ?? 0) / schoolStats.totalStudents) * 100,
        )
      : 0;

  return (
    <SchoolManagementLayout
      totalFacilities={schools.length}
      activeItemKey="reports"
      title="Reports"
      subtitle="District-wide statistics and per-school breakdowns."
      breadcrumbItems={[
        { label: 'Dashboard', href: '/school-management' },
        { label: 'Reports' },
      ]}
    >
      <div className="flex flex-col gap-8 pb-8">
        {overviewError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
            <p className="text-sm font-medium text-red-700">{overviewError}</p>
          </div>
        )}

        {/* District Overview */}
        <section className="flex flex-col gap-4">
          <h3 className="typography-body-lg font-semibold text-[#0f172a]">
            District Overview
          </h3>
          {overviewLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-3xl border border-[#e2e8f0] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                icon={School}
                label="Total Schools"
                value={overview?.totalSchools ?? schools.length}
              />
              <StatCard
                icon={Users}
                label="Total Students"
                value={(overview?.totalStudents ?? 0).toLocaleString()}
              />
              <StatCard
                icon={CheckCircle}
                label="Meal Eligible"
                value={`${eligiblePct}%`}
              />
              <StatCard
                icon={QrCode}
                label="QR Active"
                value={(overview?.activeQrCount ?? 0).toLocaleString()}
              />
            </div>
          )}
        </section>

        {/* Per-School Stats */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="typography-body-lg font-semibold text-[#0f172a]">
              Per-School Stats
            </h3>
            {selectedSchoolId && (
              <button
                type="button"
                onClick={handleExportReport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] transition-colors hover:bg-stone-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting…' : 'Export District Report'}
              </button>
            )}
          </div>

          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-64 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] focus:ring-2 focus:ring-[#006117]/20 focus:outline-none"
          >
            <option value="">Select a school…</option>
            {schools.map((s) => (
              <option key={s._id ?? s.id} value={s._id ?? s.id}>
                {s.schoolName}
              </option>
            ))}
          </select>

          {statsLoading && (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-3xl border border-[#e2e8f0] bg-white"
                />
              ))}
            </div>
          )}

          {!statsLoading && selectedSchoolId && schoolStats && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Students"
                value={(schoolStats.totalStudents ?? 0).toLocaleString()}
              />
              <StatCard
                icon={CheckCircle}
                label="Meal Eligible"
                value={`${schoolStatEligiblePct}%`}
              />
              <StatCard
                icon={QrCode}
                label="QR Active"
                value={(schoolStats.activeQrCount ?? 0).toLocaleString()}
              />
              <StatCard
                icon={CheckCircle}
                label="Pending Review"
                value={(schoolStats.pendingCount ?? 0).toLocaleString()}
              />
            </div>
          )}

          {!statsLoading && selectedSchoolId && !schoolStats && (
            <p className="typography-body-sm text-[#94a3b8]">
              No stats available for this school.
            </p>
          )}
        </section>

        {/* Global Search */}
        <section className="flex flex-col gap-4">
          <h3 className="typography-body-lg font-semibold text-[#0f172a]">
            Global Search
          </h3>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students across all schools…"
                className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pr-4 pl-9 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:ring-2 focus:ring-[#006117]/20 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005414] disabled:opacity-50"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}

          {searchResults && (
            <div className="overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <div className="border-b border-[#f1f5f9] px-6 py-3">
                <span className="typography-body-sm text-[#64748b]">
                  {searchResults.students?.length ?? 0} result
                  {(searchResults.students?.length ?? 0) !== 1 ? 's' : ''} found
                </span>
              </div>
              {(searchResults.students?.length ?? 0) === 0 ? (
                <div className="py-10 text-center">
                  <p className="typography-body text-[#64748b]">
                    No students found.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#f1f5f9]">
                  {searchResults.students.map((s) => (
                    <div
                      key={s._id ?? s.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex flex-col">
                        <span className="typography-body font-semibold text-[#0f172a]">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="typography-body-sm text-[#94a3b8]">
                          {s.studentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="typography-body-sm text-[#64748b]">
                          {s.schoolName ?? '—'}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            s.mealEligibilityStatus === 'eligible'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : s.mealEligibilityStatus === 'not-eligible'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {s.mealEligibilityStatus ?? 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </SchoolManagementLayout>
  );
}
