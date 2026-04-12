import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Plus,
  Upload,
  Pencil,
  Trash2,
  QrCode,
  Utensils,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';
import SchoolManagementLayout from '../layouts/SchoolManagementLayout';
import StudentFormModal from '../components/StudentFormModal';
import DietaryModal from '../components/DietaryModal';
import QrCodeModal from '../components/QrCodeModal';
import CsvImportWizard from '../components/CsvImportWizard';
import { fetchStudents, fetchSchoolStats, deleteStudent } from '../api';

const ELIGIBILITY_BADGE = {
  eligible: {
    label: 'Eligible',
    classes: 'bg-green-50 text-green-700 border-green-200',
  },
  'not-eligible': {
    label: 'Not Eligible',
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
};

const QR_BADGE = {
  active: { label: 'Active', classes: 'bg-green-50 text-green-700' },
  disabled: { label: 'Disabled', classes: 'bg-stone-100 text-[#64748b]' },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[#e2e8f0] bg-white px-6 py-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0fdf4]">
        <Icon className="h-5 w-5 text-[#006117]" />
      </div>
      <div>
        <p className="typography-h2 text-[#0f172a]">{value}</p>
        <p className="typography-body-sm text-[#64748b]">{label}</p>
        {sub && <p className="typography-body-sm text-[#94a3b8]">{sub}</p>}
      </div>
    </div>
  );
}

export default function StudentsScreen() {
  const { schoolId } = useParams();
  const { getToken } = useAuth();

  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [studentModal, setStudentModal] = useState(undefined); // undefined=closed, null=create, obj=edit
  const [dietaryStudent, setDietaryStudent] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [studentsData, statsData] = await Promise.all([
          fetchStudents({ getToken, schoolId }),
          fetchSchoolStats({ getToken, schoolId }).catch(() => null),
        ]);
        if (!cancelled) {
          setStudents(studentsData ?? []);
          setStats(statsData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load students');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getToken, schoolId, refreshKey]);

  async function handleDelete(student) {
    if (
      !window.confirm(
        `Delete ${student.firstName} ${student.lastName}? This cannot be undone.`,
      )
    )
      return;
    const id = student._id ?? student.id;
    setDeletingId(id);
    try {
      await deleteStudent({ getToken, id });
      setStudents((prev) => prev.filter((s) => (s._id ?? s.id) !== id));
    } catch (err) {
      alert(err.message ?? 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  }

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  // Compute stats from student list if API stats unavailable
  const totalStudents = stats?.totalStudents ?? students.length;
  const eligibleCount =
    stats?.eligibleCount ??
    students.filter((s) => s.mealEligibilityStatus === 'eligible').length;
  const pendingCount =
    stats?.pendingCount ??
    students.filter((s) => s.mealEligibilityStatus === 'pending').length;
  const eligiblePct =
    totalStudents > 0 ? Math.round((eligibleCount / totalStudents) * 100) : 0;

  const dietaryCount = students.reduce(
    (acc, s) => acc + (s.dietaryTags?.length > 0 ? 1 : 0),
    0,
  );

  const filtered = students.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q) ||
      s.gradeLevel?.toLowerCase().includes(q)
    );
  });

  const schoolName = stats?.schoolName ?? 'School';

  return (
    <>
      <SchoolManagementLayout
        totalFacilities={undefined}
        activeItemKey="schools"
        title={`${schoolName} — Students`}
        subtitle="Manage student records, dietary requirements, and QR codes."
        breadcrumbItems={[
          { label: 'Dashboard', href: '/school-management' },
          { label: 'Schools', href: '/school-management/schools' },
          { label: 'Students' },
        ]}
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search students…"
      >
        <div className="flex flex-col gap-6 pb-8">
          {/* Stats row */}
          {!loading && !error && (
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Students"
                value={totalStudents.toLocaleString()}
              />
              <StatCard
                icon={CheckCircle}
                label="Meal Eligible"
                value={`${eligiblePct}%`}
                sub={`${eligibleCount} students`}
              />
              <StatCard
                icon={Clock}
                label="Pending Review"
                value={pendingCount.toLocaleString()}
              />
              <StatCard
                icon={Utensils}
                label="Dietary Needs"
                value={dietaryCount.toLocaleString()}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] transition-colors hover:bg-stone-50"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => setStudentModal(null)}
              className="flex items-center gap-2 rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005414]"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Table card */}
          <div className="overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            {/* Headers */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-[#f1f5f9] bg-[#f8fafc] px-6 py-3">
              {[
                'Student',
                'Grade',
                'Dietary',
                'Eligibility',
                'QR Status',
                'Actions',
              ].map((h) => (
                <span
                  key={h}
                  className="text-xs font-bold tracking-wide text-[#64748b] uppercase"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Skeleton */}
            {loading && (
              <div className="flex flex-col divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-4"
                  >
                    {Array.from({ length: 5 }).map((__, j) => (
                      <div
                        key={j}
                        className="h-4 animate-pulse rounded-full bg-[#e2e8f0]"
                      />
                    ))}
                    <div className="h-4 w-24 animate-pulse rounded-full bg-[#e2e8f0]" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="typography-body text-[#64748b]">
                  {query
                    ? 'No students match your search.'
                    : 'No students registered yet.'}
                </p>
              </div>
            )}

            {/* Rows */}
            {!loading && !error && filtered.length > 0 && (
              <div className="flex flex-col divide-y divide-[#f1f5f9]">
                {filtered.map((student) => {
                  const id = student._id ?? student.id;
                  const eligibility =
                    ELIGIBILITY_BADGE[student.mealEligibilityStatus] ??
                    ELIGIBILITY_BADGE.pending;
                  const qrStatus =
                    QR_BADGE[student.qrStatus] ?? QR_BADGE.disabled;

                  return (
                    <div
                      key={id}
                      className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-[#f8fafc]"
                    >
                      {/* Student */}
                      <div className="flex flex-col">
                        <span className="typography-body font-semibold text-[#0f172a]">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="typography-body-sm text-[#94a3b8]">
                          {student.studentId}
                        </span>
                      </div>

                      {/* Grade */}
                      <span className="typography-body text-[#475569]">
                        {student.gradeLevel ?? '—'}
                      </span>

                      {/* Dietary */}
                      <div className="flex flex-wrap gap-1">
                        {student.dietaryTags?.length > 0 ? (
                          student.dietaryTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#f0fdf4] px-2 py-0.5 text-xs font-medium text-[#166534]"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="typography-body-sm text-[#94a3b8]">
                            None
                          </span>
                        )}
                        {(student.dietaryTags?.length ?? 0) > 2 && (
                          <span className="typography-body-sm text-[#94a3b8]">
                            +{student.dietaryTags.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Eligibility */}
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-semibold ${eligibility.classes}`}
                      >
                        {eligibility.label}
                      </span>

                      {/* QR Status */}
                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${qrStatus.classes}`}
                      >
                        {qrStatus.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQrStudent(student)}
                          title="View QR"
                          className="rounded-xl p-1.5 text-[#64748b] transition-colors hover:bg-stone-100"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDietaryStudent(student)}
                          title="Edit Dietary"
                          className="rounded-xl p-1.5 text-[#64748b] transition-colors hover:bg-stone-100"
                        >
                          <Utensils className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentModal(student)}
                          title="Edit"
                          className="rounded-xl p-1.5 text-[#64748b] transition-colors hover:bg-stone-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(student)}
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
                  Showing {filtered.length} of {students.length} student
                  {students.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </SchoolManagementLayout>

      {/* Modals */}
      {studentModal !== undefined && (
        <StudentFormModal
          student={studentModal}
          schoolId={schoolId}
          onClose={() => setStudentModal(undefined)}
          onSaved={() => {
            setStudentModal(undefined);
            refresh();
          }}
        />
      )}

      {dietaryStudent && (
        <DietaryModal
          student={dietaryStudent}
          onClose={() => setDietaryStudent(null)}
          onSaved={() => {
            setDietaryStudent(null);
            refresh();
          }}
        />
      )}

      {qrStudent && (
        <QrCodeModal student={qrStudent} onClose={() => setQrStudent(null)} />
      )}

      {showImport && (
        <CsvImportWizard
          schoolId={schoolId}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
