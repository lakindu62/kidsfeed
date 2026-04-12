import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import UserRowActions from './UserRowActions';

function getInitials(name = '', email = '') {
  const source = (name || email || '').trim();
  if (!source) {
    return 'U';
  }

  const tokens = source.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
}

function formatRoleLabel(role = '') {
  if (!role) {
    return 'Unassigned';
  }

  return role
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function getRoleTone(role = '') {
  const normalized = role.toLowerCase();

  if (normalized === 'admin') {
    return 'bg-[#f6e8ef] text-[#7a2348]';
  }

  if (normalized.includes('staff')) {
    return 'bg-[#e8f6e8] text-[#1b5e20]';
  }

  if (normalized.includes('manager')) {
    return 'bg-[#fef3c7] text-[#92400e]';
  }

  return 'bg-[#eef2ff] text-[#3730a3]';
}

function getStatus(user) {
  const rawStatus = String(user?.status || '').toLowerCase();

  if (
    rawStatus === 'inactive' ||
    rawStatus === 'disabled' ||
    rawStatus === 'revoked' ||
    user?.isActive === false
  ) {
    return {
      label: 'Inactive',
      dotClassName: 'bg-[#a1a1aa]',
      textClass: 'text-[#71717a]',
    };
  }

  return {
    label: 'Active',
    dotClassName: 'bg-[#22c55e]',
    textClass: 'text-[#15803d]',
  };
}

export default function UsersTable({
  users = [],
  isBusy,
  onEditRole,
  onDeleteUser,
}) {
  return (
    <Card className="rounded-[24px] border border-[#e6e9e5] bg-white">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#eef0ec] bg-[#f7f8f6]">
              <TableHead className="typography-body-sm pl-6 text-[#4b5563]">
                User Details
              </TableHead>
              <TableHead className="typography-body-sm text-[#4b5563]">
                Role
              </TableHead>
              <TableHead className="typography-body-sm text-[#4b5563]">
                Status
              </TableHead>
              <TableHead className="typography-body-sm pr-6 text-right text-[#4b5563]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="typography-body py-10 text-center text-[#6b7280]"
                >
                  No users matched your current filters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const rowKey = user?._id || user?.clerkId;
                const status = getStatus(user);

                return (
                  <TableRow key={rowKey} className="border-b border-[#eef0ec]">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg" className="h-11 w-11">
                          <AvatarImage
                            src={user?.imageUrl || user?.avatarUrl || ''}
                            alt={user?.name || user?.email || 'User avatar'}
                          />
                          <AvatarFallback>
                            {getInitials(user?.name, user?.email)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="typography-body truncate text-[#111827]">
                            {user?.name || 'Unnamed user'}
                          </p>
                          <p className="typography-body-sm truncate text-[#6b7280]">
                            {user?.email || user?.clerkId || 'No email'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={cn(
                          'typography-body-sm rounded-full border-0 px-3 py-1',
                          getRoleTone(user?.role),
                        )}
                      >
                        {formatRoleLabel(user?.role)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span
                        className={cn(
                          'typography-body-sm inline-flex items-center gap-2',
                          status.textClass,
                        )}
                      >
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            status.dotClassName,
                          )}
                        />
                        {status.label}
                      </span>
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <UserRowActions
                        disabled={isBusy}
                        onEditRole={() => onEditRole?.(user)}
                        onDeleteUser={() => onDeleteUser?.(user)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
