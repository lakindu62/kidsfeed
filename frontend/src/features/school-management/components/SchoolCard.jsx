import { useNavigate } from 'react-router-dom';
import { MapPin, MoreVertical, ArrowRight } from 'lucide-react';

function formatLastUpdated(updatedAt) {
  if (!updatedAt) return 'Last updated recently';
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `Last updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last updated ${days}d ago`;
}

export default function SchoolCard({ school }) {
  const navigate = useNavigate();
  const { schoolName, districtNumber, region, totalStudents, updatedAt } = school;
  const id = school._id ?? school.id;

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-4 px-6 pb-12 pt-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="typography-body-lg font-inter-tight font-medium text-[#0f172a]">
              {schoolName}
            </p>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0 text-[#64748b]" />
              <span className="typography-body-sm text-[#64748b]">
                {districtNumber ? `District ${districtNumber}` : ''}
                {districtNumber && region ? ' • ' : ''}
                {region ?? ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-2xl p-2 text-[#64748b] transition-colors hover:bg-stone-100"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="typography-h2 text-[#0f172a]">
            {(totalStudents ?? 0).toLocaleString()}
          </span>
          <span className="typography-body-sm text-[#64748b]">Total Students</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-[#f8fafc] px-6 py-4">
        <span className="typography-body-sm text-[#64748b]">
          {formatLastUpdated(updatedAt)}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/school-management/schools/${id}/students`)}
          className="typography-body-sm flex items-center gap-1 text-[#19e65e] transition-colors hover:underline"
        >
          View Details
          <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}
