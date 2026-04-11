import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function UserFiltersBar({
  searchValue,
  onSearchChange,
  roleValue,
  onRoleChange,
  roleOptions = [],
}) {
  return (
    <section className="rounded-[24px] border border-[#e6e9e5] bg-[#f7f7f7] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search users by name or email..."
            className="typography-body h-11 rounded-full border-[#e4e7e3] bg-white pl-10"
          />
        </div>

        <Select value={roleValue} onValueChange={onRoleChange}>
          <SelectTrigger
            className="typography-body-sm h-11 min-w-42.5 rounded-full bg-white text-[#4b5563]"
            aria-label="Role filter"
          >
            <SelectValue placeholder="Role: ALL" />
          </SelectTrigger>
          <SelectContent align="end">
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
