import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FilterOptions } from '@waterways/shared';
import type { AdminObservationUserOption } from '../api/users';
import { AdminUserFilter } from './AdminUserFilter';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from './ui/dialog';
import {
  Download,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  CalendarDays,
  Image as ImageIcon,
  FileText,
  Info,
  Shield,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';
import { toast } from 'sonner';
import { WaveIcon } from './WaveIcon';
import { DateRangeFilter } from './DateRangeFilter';
import { anonymizeOwnObservations, deleteAccount, deleteUserAudios } from '../api/account';
import { supabase } from '../services/supabase';

interface HeaderProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  observationTypes: string[];
  mapAlertMessage?: string;
  onExportCSV: () => void;
  onAccountClick?: () => void;
  adminUserOptions?: AdminObservationUserOption[];
  selectedAdminUserId?: string | null;
  onAdminUserFilterChange?: (userId: string | null) => void;
  adminUserFilterLoading?: boolean;
  onDailyReportClick?: () => void;
  projects?: Array<{ id: string; name: string }>;
  onAdminClick?: () => void;
  onTermsClick?: () => void;
  onOwnDataDeleted?: (userId: string) => void;
}

type AuthDialog = 'signin' | 'signup' | null;

export function Header({
  filters,
  onFilterChange,
  observationTypes,
  mapAlertMessage,
  onExportCSV,
  onAccountClick,
  onAdminClick,
  adminUserOptions,
  selectedAdminUserId,
  onAdminUserFilterChange,
  adminUserFilterLoading,
  onDailyReportClick,
  projects,
  onTermsClick,
  onOwnDataDeleted,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const visibleUserName = user?.showNameOnMap === false ? 'Anonymous' : user?.name;
  const [authDialog, setAuthDialog] = useState<AuthDialog>(null);
  const [mapAlertOpen, setMapAlertOpen] = useState(false);
  const [mapAlertStyle, setMapAlertStyle] = useState<globalThis.React.CSSProperties>({});
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteDataPassword, setDeleteDataPassword] = useState('');
  const [deleteDataReauthCode, setDeleteDataReauthCode] = useState('');
  const [hasRequestedDeleteDataReauth, setHasRequestedDeleteDataReauth] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountReauthCode, setDeleteAccountReauthCode] = useState('');
  const [hasRequestedDeleteAccountReauth, setHasRequestedDeleteAccountReauth] = useState(false);
  const [deleteDataError, setDeleteDataError] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isRequestingDeleteDataReauth, setIsRequestingDeleteDataReauth] = useState(false);
  const [isRequestingDeleteAccountReauth, setIsRequestingDeleteAccountReauth] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const mapAlertTriggerRef = useRef<globalThis.HTMLButtonElement | null>(null);

  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFilterChange({ ...filters, [key]: value } as FilterOptions);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || 'Failed to sign out');
    }
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const getTypeFilterLabel = () => {
    if (filters.types.length === 0) return 'All types';
    if (filters.types.length === 1) return filters.types[0];
    return `${filters.types.length} types`;
  };

  const handleSignInSuccess = () => {
    setAuthDialog(null);
  };

  const handleExportClick = () => {
    if (user) {
      onExportCSV();
      return;
    }

    toast.error('Please log in to export CSV files', {
      icon: <WaveIcon className="size-5 text-blue-700" />,
    });
    setAuthDialog('signin');
  };

  const openMapAlert = () => {
    if (!mapAlertTriggerRef.current) {
      setMapAlertOpen(true);
      return;
    }

    const rect = mapAlertTriggerRef.current.getBoundingClientRect();
    setMapAlertStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: Math.max(8, rect.left),
      zIndex: 10000,
    });
    setMapAlertOpen(true);
  };

  const closeMapAlert = () => {
    setMapAlertOpen(false);
  };

  const resetDeleteDataDialog = () => {
    setDeleteDataPassword('');
    setDeleteDataReauthCode('');
    setHasRequestedDeleteDataReauth(false);
    setDeleteDataError('');
  };

  const resetDeleteAccountDialog = () => {
    setDeleteAccountPassword('');
    setDeleteAccountReauthCode('');
    setHasRequestedDeleteAccountReauth(false);
    setDeleteAccountError('');
  };

  const requestReauthEmail = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { error } = await supabase.auth.reauthenticate();

    if (error) {
      return { ok: false, message: error.message || 'Unable to send verification code.' };
    }

    return { ok: true };
  };

  const verifyReauthCode = async (
    reauthCode: string
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    const trimmedCode = reauthCode.trim();
    if (!trimmedCode) {
      return { ok: false, message: 'Verification code is required.' };
    }

    const {
      data: { user: authUser },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !authUser) {
      return { ok: false, message: getUserError?.message || 'No active user session.' };
    }

    const { error: verifyCodeError } = await supabase.auth.updateUser({
      data: authUser.user_metadata ?? {},
      nonce: trimmedCode,
    });

    if (verifyCodeError) {
      return {
        ok: false,
        message: verifyCodeError.message || 'Verification code is invalid.',
      };
    }

    return { ok: true };
  };

  const handleEnterSubmit = (
    event: globalThis.React.KeyboardEvent<globalThis.HTMLInputElement>,
    submit: () => Promise<void>,
    disabled: boolean
  ) => {
    if (event.key !== 'Enter' || disabled) {
      return;
    }

    event.preventDefault();
    void submit();
  };

  const handleDeleteOwnData = async () => {
    const activeUser = user;
    if (activeUser == null) {
      return;
    }

    if (!deleteDataPassword.trim()) {
      setDeleteDataError('Current password is required.');
      return;
    }

    if (!hasRequestedDeleteDataReauth) {
      try {
        setIsRequestingDeleteDataReauth(true);
        setDeleteDataError('');

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: activeUser.email,
          password: deleteDataPassword,
        });
        if (signInError) {
          setDeleteDataError(signInError.message || 'Current password is incorrect.');
          return;
        }

        const reauthResult = await requestReauthEmail();
        if (!reauthResult.ok) {
          setDeleteDataError(reauthResult.message);
          return;
        }

        setHasRequestedDeleteDataReauth(true);
        toast.success('Verification code sent to your email.');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setDeleteDataError(message || 'Unable to send verification code.');
      } finally {
        setIsRequestingDeleteDataReauth(false);
      }

      return;
    }

    try {
      setIsDeletingData(true);
      setDeleteDataError('');

      const verifyCodeResult = await verifyReauthCode(deleteDataReauthCode);
      if (!verifyCodeResult.ok) {
        setDeleteDataError(verifyCodeResult.message);
        return;
      }

      // 1. Delete user's audio files + audio_recordings rows first
      const audioResult = await deleteUserAudios({
        action: 'confirm-delete-user-audio',
      });

      if (!audioResult.success) {
        setDeleteDataError(audioResult.error ?? 'Unable to delete your audio recordings.');
        return;
      }

      // 2. Then anonymize user's observations
      const result = await anonymizeOwnObservations({
        action: 'confirm-anonymize',
      });

      if (!result.success) {
        setDeleteDataError(result.error ?? 'Unable to anonymize your data.');
        return;
      }

      onOwnDataDeleted?.(activeUser.id);
      setDeleteDataDialogOpen(false);
      resetDeleteDataDialog();

      toast.success('Your observations and audio recordings were deleted successfully.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      setDeleteDataError(message || 'Unable to delete your data.');
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    const activeUser = user;
    if (activeUser == null) {
      return;
    }

    if (!deleteAccountPassword.trim()) {
      setDeleteAccountError('Current password is required.');
      return;
    }

    if (!hasRequestedDeleteAccountReauth) {
      try {
        setIsRequestingDeleteAccountReauth(true);
        setDeleteAccountError('');

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: activeUser.email,
          password: deleteAccountPassword,
        });
        if (signInError) {
          setDeleteAccountError(signInError.message || 'Current password is incorrect.');
          return;
        }

        const reauthResult = await requestReauthEmail();
        if (!reauthResult.ok) {
          setDeleteAccountError(reauthResult.message);
          return;
        }

        setHasRequestedDeleteAccountReauth(true);
        toast.success('Verification code sent to your email.');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setDeleteAccountError(message || 'Unable to send verification code.');
      } finally {
        setIsRequestingDeleteAccountReauth(false);
      }

      return;
    }

    try {
      setIsDeletingAccount(true);
      setDeleteAccountError('');

      const verifyCodeResult = await verifyReauthCode(deleteAccountReauthCode);
      if (!verifyCodeResult.ok) {
        setDeleteAccountError(verifyCodeResult.message);
        return;
      }

      const result = await deleteAccount({
        action: 'confirm-delete',
        currentPassword: deleteAccountPassword,
      });

      if (!result.success) {
        setDeleteAccountError(result.error ?? 'Unable to delete account.');
        return;
      }

      setDeleteAccountDialogOpen(false);
      resetDeleteAccountDialog();
      toast.success('Your account was deleted successfully.');

      try {
        await signOut();
      } catch {
        await supabase.auth.signOut({ scope: 'local' });
      }

      globalThis.location.assign('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setDeleteAccountError(message || 'Unable to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const showAdminUserFilter = Boolean(user?.isAdmin && onAdminUserFilterChange);
  // Always show project filter for logged-in users (admins can use both filters)
  const showProjectFilter = Boolean(user);

  return (
    <>
      <header className="bg-blue-200 border-b">
        <div className="flex items-center gap-2 px-4 py-2 flex-nowrap">
          {/* Logo + title */}
          <WaveIcon className="size-8 text-blue-700 shrink-0" />
          <h1 className="shrink-0 whitespace-nowrap">Waterways Observation System</h1>
          <button
            ref={mapAlertTriggerRef}
            type="button"
            aria-label="Map data status"
            aria-hidden={!mapAlertMessage}
            className={
              mapAlertMessage
                ? 'size-8 flex items-center justify-center rounded-md text-amber-600 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0'
                : 'size-8 invisible shrink-0'
            }
            onMouseEnter={mapAlertMessage ? openMapAlert : undefined}
            onMouseLeave={mapAlertMessage ? closeMapAlert : undefined}
            onFocus={mapAlertMessage ? openMapAlert : undefined}
            onBlur={mapAlertMessage ? closeMapAlert : undefined}
          >
            <Info className="size-4" />
          </button>

          {/* Filters — grow to fill available space */}
          <div className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap">
            {showAdminUserFilter && (
              <AdminUserFilter
                users={adminUserOptions ?? []}
                selectedUserId={selectedAdminUserId ?? null}
                onChange={onAdminUserFilterChange!}
                loading={adminUserFilterLoading ?? false}
                className="w-[100px] md:w-[120px] lg:w-[140px] font-semibold h-8"
              />
            )}

            <DateRangeFilter
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={({ dateFrom, dateTo }) => onFilterChange({ ...filters, dateFrom, dateTo })}
              className="w-[100px] md:w-[120px] lg:w-[140px] font-semibold h-8"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 bg-background font-semibold h-8"
                >
                  <span
                    className="w-[96px] inline-block overflow-hidden truncate align-middle text-left"
                    title={getTypeFilterLabel()}
                  >
                    {getTypeFilterLabel()}
                  </span>
                  <ChevronDown className="size-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px] z-[9999]" align="start">
                <DropdownMenuLabel>Observation Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filters.types.length > 0 && (
                  <>
                    <DropdownMenuItem onClick={() => onFilterChange({ ...filters, types: [] })}>
                      Clear selection
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {observationTypes.map((type) => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={filters.types.includes(type)}
                    onCheckedChange={() => handleTypeToggle(type)}
                    onSelect={(e: globalThis.Event) => e.preventDefault()}
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              placeholder="Search keywords..."
              value={filters.keywords}
              onChange={(e) => handleFilterChange('keywords', e.target.value)}
              className="w-[140px] md:w-[160px] lg:w-[200px] bg-background h-8 text-sm font-semibold"
            />

            <Button
              type="button"
              variant={filters.hasMedia ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 font-semibold h-8"
              onClick={() => handleFilterChange('hasMedia', !filters.hasMedia)}
              title="Only show observations with media"
            >
              <ImageIcon className="size-4 mr-2" />
              Media only
            </Button>

            {showProjectFilter && (
              <Select
                value={filters.myProjects || 'all'}
                onValueChange={(value: string) => handleFilterChange('myProjects', value)}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[100px] md:w-[120px] lg:w-[140px] bg-background font-semibold shrink-0 h-8"
                >
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects && projects.length > 0 ? (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No projects yet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {user?.isAdmin && (
            <Button onClick={onDailyReportClick} variant="outline" size="sm" className="shrink-0">
              <CalendarDays className="size-4 mr-2" />
              Daily Report
            </Button>
          )}
          <Button onClick={handleExportClick} variant="outline" size="sm" className="shrink-0">
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>

          {!user && (
            <Button variant="default" size="sm" onClick={() => onAccountClick?.()}>
              <LogIn className="size-4 mr-2" />
              Login
            </Button>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title={visibleUserName}
                  aria-label={visibleUserName}
                  className="shrink-0"
                >
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-[9999]">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p>{visibleUserName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                {user?.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onAdminClick?.()}>
                      <Shield className="size-4 mr-2" />
                      Admin
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onTermsClick?.()}>
                  <FileText className="size-4 mr-2" />
                  Terms and Conditions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    resetDeleteDataDialog();
                    setDeleteDataDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete My Data
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    resetDeleteAccountDialog();
                    setDeleteAccountDialogOpen(true);
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete My Account
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {mapAlertMessage &&
        mapAlertOpen &&
        createPortal(
          <div
            style={mapAlertStyle}
            className="w-72 rounded-md bg-gray-900 text-gray-100 text-xs px-3 py-2 shadow-xl whitespace-normal leading-relaxed"
          >
            {mapAlertMessage}
          </div>,
          document.body
        )}

      {/* Auth Dialogs */}
      <Dialog
        open={authDialog === 'signin'}
        onOpenChange={(open: boolean) => {
          if (!open) setAuthDialog(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Sign In</DialogTitle>
          <DialogDescription className="sr-only">
            Sign in to your account to access additional features
          </DialogDescription>
          <SignIn
            onNavigateToSignUp={() => setAuthDialog('signup')}
            onSuccess={handleSignInSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={authDialog === 'signup'}
        onOpenChange={(open: boolean) => {
          if (!open) setAuthDialog(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="sr-only">Sign Up</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new account to access additional features
          </DialogDescription>
          <SignUp
            onNavigateToSignIn={() => setAuthDialog('signin')}
            onSuccess={handleSignInSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDataDialogOpen}
        onOpenChange={(open: boolean) => {
          setDeleteDataDialogOpen(open);
          if (!open) {
            resetDeleteDataDialog();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Your Data</DialogTitle>
            <DialogDescription>
              This will remove personal identifiers from your observations and keep the observations
              as anonymous records. Any audio recordings connected to your observations will also be
              permanently deleted from storage. Enter your current password, then request and enter
              the email verification code to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteDataPassword}
            onChange={(event) => setDeleteDataPassword(event.target.value)}
            onKeyDown={(event) =>
              handleEnterSubmit(
                event,
                handleDeleteOwnData,
                isDeletingData || isRequestingDeleteDataReauth
              )
            }
            placeholder="Current password"
            type="password"
            autoComplete="current-password"
          />
          {hasRequestedDeleteDataReauth && (
            <Input
              value={deleteDataReauthCode}
              onChange={(event) => setDeleteDataReauthCode(event.target.value)}
              onKeyDown={(event) =>
                handleEnterSubmit(
                  event,
                  handleDeleteOwnData,
                  isDeletingData || isRequestingDeleteDataReauth
                )
              }
              placeholder="Email verification code"
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          )}
          {deleteDataError ? <p className="text-sm text-destructive">{deleteDataError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDataDialogOpen(false);
                resetDeleteDataDialog();
              }}
              disabled={isDeletingData || isRequestingDeleteDataReauth}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteOwnData}
              disabled={isDeletingData || isRequestingDeleteDataReauth}
            >
              {isRequestingDeleteDataReauth
                ? 'Sending Code...'
                : isDeletingData
                  ? 'Deleting Audio and Anonymizing Data...'
                  : hasRequestedDeleteDataReauth
                    ? 'Confirm Delete My Data'
                    : 'Send Verification Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteAccountDialogOpen}
        onOpenChange={(open: boolean) => {
          setDeleteAccountDialogOpen(open);
          if (!open) {
            resetDeleteAccountDialog();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Your Account</DialogTitle>
            <DialogDescription>
              This permanently deletes your account. Enter your current password, then verify with
              the email code to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteAccountPassword}
            onChange={(event) => setDeleteAccountPassword(event.target.value)}
            onKeyDown={(event) =>
              handleEnterSubmit(
                event,
                handleDeleteAccount,
                isDeletingAccount || isRequestingDeleteAccountReauth
              )
            }
            placeholder="Current password"
            type="password"
            autoComplete="current-password"
          />
          {hasRequestedDeleteAccountReauth && (
            <Input
              value={deleteAccountReauthCode}
              onChange={(event) => setDeleteAccountReauthCode(event.target.value)}
              onKeyDown={(event) =>
                handleEnterSubmit(
                  event,
                  handleDeleteAccount,
                  isDeletingAccount || isRequestingDeleteAccountReauth
                )
              }
              placeholder="Email verification code"
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          )}
          {deleteAccountError ? (
            <p className="text-sm text-destructive">{deleteAccountError}</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteAccountDialogOpen(false);
                resetDeleteAccountDialog();
              }}
              disabled={isDeletingAccount || isRequestingDeleteAccountReauth}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || isRequestingDeleteAccountReauth}
            >
              {isRequestingDeleteAccountReauth
                ? 'Sending Code...'
                : isDeletingAccount
                  ? 'Deleting Account...'
                  : hasRequestedDeleteAccountReauth
                    ? 'Confirm Delete My Account'
                    : 'Send Verification Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
