import { useMemo, useState } from 'react';

import StatusMessage from '@/components/common/StatusMessage';
import { Card, CardContent } from '@/components/ui/card';
import { USER_ROLES, listUserRoles } from '@/lib/user-roles';
import { toast } from 'sonner';

import ConfirmDeleteUserDialog from '../components/ConfirmDeleteUserDialog';
import UserFiltersBar from '../components/UserFiltersBar';
import UserRoleDialog from '../components/UserRoleDialog';
import UsersTable from '../components/UsersTable';
import { useUsersQuery } from '../hooks/use-users-query';
import UserManagementLayout from '../layouts/UserManagementLayout';

function toRoleLabel(role) {
  return role
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export default function UserManagementPage() {
  const [searchValue, setSearchValue] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionError, setActionError] = useState('');
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeRoleUser, setActiveRoleUser] = useState(null);
  const [activeDeleteUser, setActiveDeleteUser] = useState(null);

  const { users, isLoading, isMutating, error, updateRole, deleteUser } =
    useUsersQuery({ roleFilter });

  const roleOptions = useMemo(
    () =>
      listUserRoles().map((role) => ({
        value: role,
        label: toRoleLabel(role),
      })),
    [],
  );

  const roleFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Role: ALL' }].concat(roleOptions),
    [roleOptions],
  );

  const visibleUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const searchable =
        `${user?.name || ''} ${user?.email || ''} ${user?.clerkId || ''}`
          .trim()
          .toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [searchValue, users]);

  const handleRoleSave = async (newRole) => {
    if (!activeRoleUser || !newRole) {
      return;
    }

    setIsRoleUpdating(true);
    setActionError('');

    try {
      const result = await updateRole({
        userId: activeRoleUser?._id,
        clerkId: activeRoleUser?.clerkId,
        role: newRole,
      });

      toast.success(result?.message || 'User role updated successfully.');
      setActiveRoleUser(null);
    } catch (updateError) {
      setActionError(updateError?.message || 'Failed to update user role.');
    } finally {
      setIsRoleUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!activeDeleteUser) {
      return;
    }

    setIsDeleting(true);
    setActionError('');

    try {
      const result = await deleteUser({
        userId: activeDeleteUser?._id,
        clerkId: activeDeleteUser?.clerkId,
      });

      toast.success(result?.message || 'User deleted successfully.');
      setActiveDeleteUser(null);
    } catch (deleteError) {
      setActionError(deleteError?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <UserManagementLayout
      activeItemKey="users"
      title="User Access Control"
      subtitle="Manage roles and account access for school staff and parent users."
    >
      <div className="space-y-5 pb-6">
        <Card className="rounded-[24px] border border-[#e6e9e5] bg-white">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="typography-body text-[#4b5563]">
                Maintain administrative integrity by assigning roles and
                controlling account access through an admin-managed workflow.
              </p>
            </div>

            <UserFiltersBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              roleValue={roleFilter}
              onRoleChange={setRoleFilter}
              roleOptions={roleFilterOptions}
            />
          </CardContent>
        </Card>

        {actionError ? (
          <StatusMessage kind="error" message={actionError} />
        ) : null}
        {error ? <StatusMessage kind="error" message={error} /> : null}

        {isLoading ? (
          <StatusMessage
            kind="info"
            message="Loading users for admin management..."
          />
        ) : (
          <UsersTable
            users={visibleUsers}
            isBusy={isMutating || isRoleUpdating || isDeleting}
            onEditRole={(user) => {
              setActionError('');
              setActiveRoleUser(user);
            }}
            onDeleteUser={(user) => {
              setActionError('');
              setActiveDeleteUser(user);
            }}
          />
        )}
      </div>

      <UserRoleDialog
        key={activeRoleUser?._id || activeRoleUser?.clerkId || 'no-user'}
        open={Boolean(activeRoleUser)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRoleUser(null);
          }
        }}
        user={activeRoleUser}
        roleOptions={roleOptions.filter(
          (option) => option.value !== USER_ROLES.UNASSIGNED,
        )}
        isSubmitting={isRoleUpdating}
        onSubmit={handleRoleSave}
      />

      <ConfirmDeleteUserDialog
        open={Boolean(activeDeleteUser)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveDeleteUser(null);
          }
        }}
        user={activeDeleteUser}
        isDeleting={isDeleting}
        onConfirm={handleDeleteUser}
      />
    </UserManagementLayout>
  );
}
