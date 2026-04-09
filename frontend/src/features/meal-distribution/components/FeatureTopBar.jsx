import { Bell, Search, Settings } from 'lucide-react';

export default function FeatureTopBar({
  title,
  subtitle,
  query,
  onQueryChange,
  searchPlaceholder = 'Search...',
}) {
  const showSearch = Boolean(searchPlaceholder);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 py-3">
      <div>
        <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#166534]">
          {title}
        </h1>
        <p className="text-xs font-medium text-zinc-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="flex h-11 w-[236px] items-center rounded-full bg-[#e6e9e5] px-4">
            <Search className="h-4 w-4 text-zinc-500" />
            {onQueryChange ? (
              <input
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                className="ml-3 w-full bg-transparent text-xs font-medium text-zinc-600 placeholder:text-zinc-500 focus:outline-none"
                placeholder={searchPlaceholder}
              />
            ) : (
              <span className="ml-3 text-xs font-medium text-zinc-500">
                {searchPlaceholder}
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200"
        >
          <Settings className="h-5 w-5" />
        </button>
        <div className="h-10 w-10 rounded-full border-2 border-[#9df898] bg-gradient-to-br from-[#111827] to-[#166534]" />
      </div>
    </header>
  );
}
