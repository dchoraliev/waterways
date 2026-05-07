import { useMemo, useState } from 'react';
import { Check, LoaderCircle, Search, User } from 'lucide-react';
import type { AdminObservationUserOption } from '../api/users';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { cn } from './ui/utils';

interface AdminUserFilterProps {
  users: AdminObservationUserOption[];
  selectedUserId: string | null;
  onChange: (userId: string | null) => void;
  loading?: boolean;
  className?: string;
}

export function AdminUserFilter({
  users,
  selectedUserId,
  onChange,
  loading = false,
  className,
}: AdminUserFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => user.searchValue.includes(normalizedQuery));
  }, [query, users]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery('');
    }
  };

  const handleSelect = (userId: string | null) => {
    onChange(userId);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('w-[140px] justify-between bg-background font-normal', className)}
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <User className="size-4 shrink-0" />
          <span className="truncate">{selectedUser?.displayLabel ?? 'All users'}</span>
        </span>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle>Filter observations by user</DialogTitle>
          <DialogDescription>Search by first name, last name, email, or user ID.</DialogDescription>

          <div className="space-y-4">
            <Input
              autoFocus
              placeholder="Search users..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className="max-h-[420px] overflow-y-auto rounded-md border">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm hover:bg-accent"
              >
                <div>
                  <p className="font-medium text-foreground">All users</p>
                  <p className="text-muted-foreground">Show observations from every user</p>
                </div>
                {!selectedUserId && <Check className="size-4 text-blue-600" />}
              </button>

              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No users matched that search.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = user.id === selectedUserId;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelect(user.id)}
                      className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.displayName}</p>
                        <p className="truncate text-muted-foreground">
                          {user.secondaryLabel ?? `ID ${user.id.slice(0, 8)}`}
                          {user.observationCount > 0
                            ? ` • ${user.observationCount} observation${user.observationCount === 1 ? '' : 's'}`
                            : ' • No observations yet'}
                        </p>
                      </div>
                      {isSelected && <Check className="size-4 shrink-0 text-blue-600" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
