import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import SchoolManagementLayout from '../layouts/SchoolManagementLayout';
import SchoolFormModal from '../components/SchoolFormModal';
import { fetchSchools, deleteSchool } from '../api';

function formatLastUpdated(updatedAt) {
  if (!updatedAt) return '—';
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SchoolsScreen() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [modalSchool, setModalSchool] = useState(undefined); // undefined=closed, null=create, obj=edit
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSchools({ getToken });
        if (!cancelled) setSchools(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load schools');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [getToken, refreshKey]);

  async function handleDelete(school) {
    if (!window.confirm(`Delete "${school.schoolName}"? This cannot be undone.`)) return;
    const id = school._id ?? school.id;
    setDeletingId(id);
    try {
      await deleteSchool({ getToken, id });
      setSchools((prev) => prev.filter((s) => (s._id ?? s.id) !== id));
    } catch (err) {
      alert(err.message ?? 'Failed to delete school');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = schools.filter((s) =>
    s.schoolName?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <SchoolManagementLayout
        totalFacilities={schools.length}
        activeItemKey="schools"
        title="Schools"
        subtitle="Manage all registered schools and their details."
        breadcrumbItems={[
          { label: 'Dashboard', href: '/school-management' },
          { label: 'Schools' },
        ]}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search schools…"
      >
        <div className="flex flex-col gap-6 pb-8">
          {/* Top actions */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setModalSchool(null)}
              className="flex items-center gap-2 rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005414] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add School
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Table card */}
          <div className="overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_auto] border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-3 gap-4">
              {['School Name', 'District', 'Region', 'Manager Email', 'Updated', 'Actions'].map((h) => (
                <span key={h} className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                  {h}
                </span>
              ))}
            </div>

            {/* Skeleton rows */}
            {loading && (
              <div className="flex flex-col divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_auto] items-center gap-4 px-6 py-4">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <div key={j} className="h-4 animate-pulse rounded-full bg-[#e2e8f0]" />
                    ))}
                    <div className="h-4 w-20 animate-pulse rounded-full bg-[#e2e8f0]" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="typography-body text-[#64748b]">
                  {query ? 'No schools match your search.' : 'No schools registered yet.'}
                </p>
              </div>
            )}

            {/* Data rows */}
            {!loading && !error && filtered.length > 0 && (
              <div className="flex flex-col divide-y divide-[#f1f5f9]">
                {filtered.map((school) => {
                  const id = school._id ?? school.id;
                  return (
                    <div
                      key={id}
                      className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-[#f8fafc]"
                    >
                      <div className="flex flex-col">
                        <span className="typography-body font-semibold text-[#0f172a]">
                          {school.schoolName}
                        </span>
                        <span className="typography-body-sm text-[#94a3b8]">
                          {school.totalStudents ?? 0} students
                        </span>
                      </div>
                      <span className="typography-body text-[#475569]">
                        {school.districtNumber ?? '—'}
                      </span>
                      <span className="typography-body text-[#475569]">
                        {school.region ?? '—'}
                      </span>
                      <span className="typography-body truncate text-[#475569]">
                        {school.managerEmail ?? '—'}
                      </span>
                      <span className="typography-body-sm text-[#94a3b8]">
                        {formatLastUpdated(school.updatedAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/school-management/schools/${id}/students`)}
                          title="View Students"
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-[#006117] transition-colors hover:bg-[#f0fdf4]"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Students
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalSchool(school)}
                          title="Edit"
                          className="rounded-xl p-1.5 text-[#64748b] transition-colors hover:bg-stone-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(school)}
                          disabled={deletingId === id}
                          title="Delete"
                          className="rounded-xl p-1.5 text-[#ef4444] transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {!loading && filtered.length > 0 && (
              <div className="border-t border-[#f1f5f9] px-6 py-3">
                <span className="typography-body-sm text-[#64748b]">
                  Showing {filtered.length} of {schools.length} school{schools.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </SchoolManagementLayout>

      {/* Add / Edit modal */}
      {modalSchool !== undefined && (
        <SchoolFormModal
          school={modalSchool}
          onClose={() => setModalSchool(undefined)}
          onSaved={() => {
            setModalSchool(undefined);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
