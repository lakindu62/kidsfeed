import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { createStudent, updateStudent } from '../api';

const ELIGIBILITY_OPTIONS = [
  { value: 'eligible', label: 'Eligible' },
  { value: 'not-eligible', label: 'Not Eligible' },
  { value: 'pending', label: 'Pending' },
];

export default function StudentFormModal({ student, schoolId, onClose, onSaved }) {
  const { getToken } = useAuth();
  const isEdit = Boolean(student);

  const [form, setForm] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    gradeLevel: '',
    mealEligibilityStatus: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (student) {
      setForm({
        studentId: student.studentId ?? '',
        firstName: student.firstName ?? '',
        lastName: student.lastName ?? '',
        gradeLevel: student.gradeLevel ?? '',
        mealEligibilityStatus: student.mealEligibilityStatus ?? 'pending',
      });
    }
  }, [student]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const body = {
      firstName: form.firstName,
      lastName: form.lastName,
      ...(form.gradeLevel ? { gradeLevel: form.gradeLevel } : {}),
      mealEligibilityStatus: form.mealEligibilityStatus,
      ...(!isEdit ? { studentId: form.studentId } : {}),
    };

    try {
      if (isEdit) {
        await updateStudent({ getToken, id: student._id ?? student.id, body });
      } else {
        await createStudent({ getToken, schoolId, body });
      }
      onSaved();
    } catch (err) {
      setError(err.message ?? 'Something went wrong');
      if (err.errors?.length) {
        setFieldErrors(
          Object.fromEntries(err.errors.map((e) => [e.field, e.message]))
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#e2e8f0] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
          <h2 className="typography-body-lg font-semibold text-[#0f172a]">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#64748b] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {/* Student ID — only on create */}
          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#334155]">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                required
                placeholder="e.g. STU-1001"
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
              />
              {fieldErrors.studentId && (
                <p className="text-xs text-red-600">{fieldErrors.studentId}</p>
              )}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#334155]">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                placeholder="e.g. Charlie"
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
              />
              {fieldErrors.firstName && (
                <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#334155]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                placeholder="e.g. Brown"
                className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Grade Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              Grade Level{' '}
              <span className="text-xs font-normal text-[#94a3b8]">(optional)</span>
            </label>
            <input
              name="gradeLevel"
              value={form.gradeLevel}
              onChange={handleChange}
              placeholder="e.g. Grade 4 or Kindergarten"
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            />
            {fieldErrors.gradeLevel && (
              <p className="text-xs text-red-600">{fieldErrors.gradeLevel}</p>
            )}
          </div>

          {/* Meal Eligibility */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              Meal Eligibility Status
            </label>
            <select
              name="mealEligibilityStatus"
              value={form.mealEligibilityStatus}
              onChange={handleChange}
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            >
              {ELIGIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005414] disabled:opacity-50"
            >
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
