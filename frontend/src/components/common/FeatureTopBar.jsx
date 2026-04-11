import { UserButton } from '@clerk/clerk-react';
import { Bell, Search, Settings } from 'lucide-react';
import Breadcrumb from './Breadcrumb';

export default function FeatureTopBar({
  title,
  subtitle,
  query,
  onQueryChange,
  onQuerySubmit,
  searchPlaceholder = 'Search...',
  breadcrumbItems,
}) {
  const showSearch = Boolean(searchPlaceholder);

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 py-3">
      <div>
        <h1 className="typography-h2 text-[#166534]">{title}</h1>
        {breadcrumbItems?.length > 0 && (
          <div className="ml-1">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}
        <p className="typography-body text-zinc-500">{subtitle}</p>
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
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onQuerySubmit?.(event.target.value);
                  }
                }}
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

        <UserButton
          appearance={{
            elements: { avatarBox: 'h-10 w-10 border-2 border-[#9df898]' },
          }}
        />
      </div>
    </header>
  );
}
