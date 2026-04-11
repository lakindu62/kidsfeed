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

  const selectedRoleLabel = useMemo(() => {
    return roleOptions.find((option) => option.value === selectedRole)?.label;
  }, [roleOptions, selectedRole]);

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
            <p className="typography-body-sm text-[#6b7280]">
              New role: {selectedRoleLabel}
            </p>
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
