import {
  CircleHelp,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  LogOut,
  Megaphone,
  UtensilsCrossed,
} from 'lucide-react';

function SidebarLink({ icon, label, active = false, onClick }) {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex h-9 w-full items-center gap-3 rounded-lg px-2 text-left text-xs font-medium transition-colors',
        active
          ? 'bg-white text-[#116e20] shadow-sm'
          : 'text-stone-600 hover:bg-stone-100',
      ].join(' ')}
    >
      <Icon className="h-4.5 w-4.5" />
      <span>{label}</span>
    </button>
  );
}

export default function FeatureSidebar({ schoolName, activeItem, navigate }) {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#f5f5f4] py-6">
      <div className="px-6 pb-6">
        <p className="text-xs font-medium text-stone-900">KIDFEED</p>
        <p className="text-xs font-medium text-stone-500">{schoolName}</p>
      </div>

      <nav className="flex flex-1 flex-col px-6 pt-6">
        <div className="flex flex-col gap-1">
          <SidebarLink
            icon={LayoutGrid}
            label="Dashboard"
            active={activeItem === 'dashboard'}
            onClick={() => navigate('/meal-distribution')}
          />
          <SidebarLink
            icon={UtensilsCrossed}
            label="Meal Sessions"
            active={activeItem === 'sessions'}
            onClick={() => navigate('/meal-distribution/sessions')}
          />
          <SidebarLink
            icon={ClipboardCheck}
            label="Mark Attendance"
            active={activeItem === 'attendance'}
            onClick={() => navigate('/meal-distribution/attendance')}
          />
          <SidebarLink icon={Megaphone} label="No-Show Alerts" />
        </div>
        <div className="mt-1">
          <SidebarLink icon={FileText} label="Reports" />
        </div>
      </nav>

      <div className="border-t border-[#e7e5e480] px-6 pt-[25px]">
        <button
          type="button"
          className="flex h-9 w-full items-center gap-3 rounded-lg px-2 text-xs font-medium text-stone-500 hover:bg-stone-200"
        >
          <CircleHelp className="h-4.5 w-4.5" />
          Support
        </button>
        <button
          type="button"
          className="mt-1 flex h-9 w-full items-center gap-3 rounded-lg px-2 text-xs font-medium text-stone-500 hover:bg-stone-200"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
