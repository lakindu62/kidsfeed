import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { updateDietary } from '../api';
import { DIETARY_TAGS } from '../constants';

export default function DietaryModal({ student, onClose, onSaved }) {
  const { getToken } = useAuth();
  const [selected, setSelected] = useState(new Set(student.dietaryTags ?? []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function toggle(tag) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await updateDietary({ getToken, id: student._id ?? student.id, dietaryTags: [...selected] });
      onSaved();
    } catch (err) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#e2e8f0] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
          <div>
            <h2 className="typography-body-lg font-semibold text-[#0f172a]">Dietary Tags</h2>
            <p className="typography-body-sm text-[#64748b]">
              {student.firstName} {student.lastName}
            </p>
          </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 py-5">
          {DIETARY_TAGS.map((tag) => (
            <label key={tag} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(tag)}
                onChange={() => toggle(tag)}
                className="h-4 w-4 rounded accent-[#006117]"
              />
              <span className="typography-body text-[#0f172a]">{tag}</span>
            </label>
          ))}

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
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
