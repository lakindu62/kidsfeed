import { Plus } from 'lucide-react';

export default function AddSchoolCard({ onAdd }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] p-8 text-center transition-colors hover:border-[#19e65e] hover:bg-[#f0fdf4]"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e2e8f0]">
        <Plus className="h-[17px] w-[17px] text-[#64748b]" />
      </div>
      <p className="typography-body font-medium text-[#0f172a]">
        Add Educational Facility
      </p>
      <p className="typography-body-sm max-w-50 text-[#64748b]">
        Register a new school to start tracking meal program eligibility.
      </p>
    </button>
  );
}
