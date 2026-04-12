import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Download, Plus } from 'lucide-react';
import SchoolManagementLayout from '../layouts/SchoolManagementLayout';
import SchoolCard from '../components/SchoolCard';
import AddSchoolCard from '../components/AddSchoolCard';
import { fetchSchools } from '../api';

export default function SchoolOverviewScreen() {
  const { getToken } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSchools() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSchools({ getToken });
        if (!cancelled) {
          setSchools(data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load schools');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSchools();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const totalFacilities = schools.length;

  return (
    <SchoolManagementLayout
      totalFacilities={totalFacilities}
      activeItemKey="dashboard"
    >
      <div className="flex flex-col gap-10 pb-8">
        {/* Page header */}
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-6 py-3 text-xs font-medium text-[#334155] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-stone-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export District Report
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-3xl bg-[#ffdcc6] px-6 py-3 text-xs font-medium text-[#0f172a] transition-colors hover:bg-[#ffc9a8]"
            >
              <Plus className="h-4 w-4" />
              Add New School
            </button>
          </div>
        </div>

        {/* Content */}
        {loading && (
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[231px] animate-pulse rounded-3xl border border-[#e2e8f0] bg-white"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-3 gap-6">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onViewDetails={() => {}}
              />
            ))}
            <AddSchoolCard onAdd={() => {}} />
          </div>
        )}
      </div>
    </SchoolManagementLayout>
  );
}
