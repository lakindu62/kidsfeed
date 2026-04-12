import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { createSchool, updateSchool } from '../api';

const FIELD_LABELS = {
  schoolName: 'School Name',
  managerEmail: 'Manager Email',
  districtNumber: 'District Number',
  region: 'Region',
};

export default function SchoolFormModal({ school, onClose, onSaved }) {
  const { getToken } = useAuth();
  const isEdit = Boolean(school);

  const [form, setForm] = useState({
    schoolName: '',
    managerEmail: '',
    districtNumber: '',
    region: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (school) {
      setForm({
        schoolName: school.schoolName ?? '',
        managerEmail: school.managerEmail ?? '',
        districtNumber: school.districtNumber ?? '',
        region: school.region ?? '',
      });
    }
  }, [school]);

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
      schoolName: form.schoolName,
      managerEmail: form.managerEmail,
      districtNumber: form.districtNumber,
      ...(form.region ? { region: form.region } : {}),
    };

    try {
      if (isEdit) {
        await updateSchool({ getToken, id: school._id ?? school.id, body });
      } else {
        await createSchool({ getToken, body });
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
            {isEdit ? 'Edit School' : 'Add New School'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#64748b] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {/* School Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              name="schoolName"
              value={form.schoolName}
              onChange={handleChange}
              required
              placeholder="e.g. Lincoln Elementary"
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            />
            {fieldErrors.schoolName && (
              <p className="text-xs text-red-600">{fieldErrors.schoolName}</p>
            )}
          </div>

          {/* Manager Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              Manager Email <span className="text-red-500">*</span>
            </label>
            <input
              name="managerEmail"
              type="email"
              value={form.managerEmail}
              onChange={handleChange}
              required
              placeholder="manager@school.edu"
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            />
            {fieldErrors.managerEmail && (
              <p className="text-xs text-red-600">{fieldErrors.managerEmail}</p>
            )}
          </div>

          {/* District Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              District Number <span className="text-red-500">*</span>
            </label>
            <input
              name="districtNumber"
              value={form.districtNumber}
              onChange={handleChange}
              required
              placeholder="e.g. 402"
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            />
            {fieldErrors.districtNumber && (
              <p className="text-xs text-red-600">{fieldErrors.districtNumber}</p>
            )}
          </div>

          {/* Region (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">
              Region <span className="text-xs font-normal text-[#94a3b8]">(optional)</span>
            </label>
            <input
              name="region"
              value={form.region}
              onChange={handleChange}
              placeholder="e.g. North West"
              className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#006117]/20"
            />
            {fieldErrors.region && (
              <p className="text-xs text-red-600">{fieldErrors.region}</p>
            )}
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
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
