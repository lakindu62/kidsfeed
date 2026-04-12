import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLE_PAGE_ACCESS = {
  admin: [],
  inventory_manager: ['Inventory'],
  meal_planner: ['Menu management'],
  menu_manager: ['Menu management'],
  school_staff: ['Meal distribution'],
  school_admin: ['School management'],
  unassigned: [],
};

function toRoleLabel(role) {
  if (!role) {
    return 'Unassigned';
  }

  return role
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export default function UserRoleDialog({
  open,
  onOpenChange,
  user,
  roleOptions = [],
  isSubmitting,
  onSubmit,
}) {
  const [selectedRole, setSelectedRole] = useState(user?.role || '');

  const isUnchanged = selectedRole === (user?.role || '');
  const canSubmit = Boolean(selectedRole) && !isUnchanged && !isSubmitting;

  const currentRoleLabel = useMemo(
    () => user?.role || 'unassigned',
    [user?.role],
  );

  const currentRoleDisplay = useMemo(
    () => toRoleLabel(currentRoleLabel),
    [currentRoleLabel],
  );

  const selectedRoleLabel = useMemo(() => {
    return roleOptions.find((option) => option.value === selectedRole)?.label;
  }, [roleOptions, selectedRole]);

  const selectedRolePages = useMemo(() => {
    return ROLE_PAGE_ACCESS[selectedRole] || [];
  }, [selectedRole]);

  const isAdminRole = selectedRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="typography-h2 text-[#0f172a]">
            Update User Role
          </DialogTitle>
          <DialogDescription className="typography-body">
            Change the role for {user?.name || user?.email || 'this user'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="typography-body-sm text-[#6b7280]">
            Current role:{' '}
            <span className="font-medium text-[#111827]">
              {currentRoleDisplay}
            </span>
          </p>

          <p className="typography-body-sm text-[#4b5563]">Select new role</p>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full" aria-label="Select user role">
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRoleLabel ? (
            <div className="space-y-2 pt-1">
              <p className="typography-body-sm text-[#6b7280]">
                New role:{' '}
                <span className="font-medium text-[#111827]">
                  {selectedRoleLabel}
                </span>
              </p>

              <div className="space-y-1">
                <p className="typography-body-sm text-[#4b5563]">
                  They will be able to access:
                </p>

                {isAdminRole ? (
                  <p className="typography-body-sm text-[#6b7280]">
                    Everything in the application.
                  </p>
                ) : selectedRolePages.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-[#6b7280]">
                    {selectedRolePages.map((page) => (
                      <li key={page}>{page}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="typography-body-sm text-[#6b7280]">
                    No application pages yet. This user will stay on the role
                    pending page.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSubmit?.(selectedRole)}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Saving...' : 'Save role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
