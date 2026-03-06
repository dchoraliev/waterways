import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FilterOptions } from '@waterways/shared';
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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import {
  Download,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  CalendarDays,
  Info,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';
import { toast } from 'sonner';
import { WaveIcon } from './WaveIcon';
import { DateRangeFilter } from './DateRangeFilter';

interface HeaderProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  observationTypes: string[];
  mapAlertMessage?: string;
  onExportCSV: () => void;
  onAccountClick?: () => void;
  filteredUserId?: string | null;
  filteredUserName?: string;
  onClearUserFilter?: () => void;
  onDailyReportClick?: () => void;
  projects?: Array<{ id: string; name: string }>;
  onAdminClick?: () => void;
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
  filteredUserId,
  filteredUserName,
  onClearUserFilter,
  onDailyReportClick,
  projects,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const visibleUserName = user?.showNameOnMap === false ? 'Anonymous' : user?.name;
  const [authDialog, setAuthDialog] = useState<AuthDialog>(null);
  const [mapAlertOpen, setMapAlertOpen] = useState(false);
  const [mapAlertStyle, setMapAlertStyle] = useState<globalThis.React.CSSProperties>({});
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
    if (!user) {
      toast.error('Please log in to export CSV files', {
        icon: <WaveIcon className="size-5 text-blue-700" />,
      });
      setAuthDialog('signin');
    } else {
      onExportCSV();
    }
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

  return (
    <>
      <header className="bg-blue-200 border-b">
        <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <WaveIcon className="size-8 text-blue-700" />
            <h1 className="whitespace-nowrap">Waterways Observation System</h1>
            <button
              ref={mapAlertTriggerRef}
              type="button"
              aria-label="Map data status"
              aria-hidden={!mapAlertMessage}
              className={
                mapAlertMessage
                  ? 'size-8 flex items-center justify-center rounded-md text-amber-600 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500'
                  : 'size-8 invisible'
              }
              onMouseEnter={mapAlertMessage ? openMapAlert : undefined}
              onMouseLeave={mapAlertMessage ? closeMapAlert : undefined}
              onFocus={mapAlertMessage ? openMapAlert : undefined}
              onBlur={mapAlertMessage ? closeMapAlert : undefined}
            >
              <Info className="size-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            {filteredUserId && filteredUserName && (
              <div className="hidden lg:flex items-center gap-2 text-sm bg-blue-100 text-blue-900 px-3 py-1.5 rounded-md">
                <User className="size-4" />
                <span className="whitespace-nowrap">Filtering by: {filteredUserName}</span>
                <button
                  onClick={onClearUserFilter}
                  className="hover:bg-blue-200 rounded-full size-5 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <DateRangeFilter
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={({ dateFrom, dateTo }) =>
                onFilterChange({
                  ...filters,
                  dateFrom,
                  dateTo,
                })
              }
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[165px] justify-between bg-background font-normal"
                >
                  {getTypeFilterLabel()}
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
              className="w-[220px] bg-background"
            />

            {user && (
              <Select
                value={filters.myProjects || 'all'}
                onValueChange={(value: string) => handleFilterChange('myProjects', value)}
              >
                <SelectTrigger className="w-[170px] bg-background">
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

            <Button onClick={onDailyReportClick} variant="outline" size="sm" className="shrink-0">
              <CalendarDays className="size-4 mr-2" />
              Daily Report
            </Button>
            <Button onClick={handleExportClick} variant="outline" size="sm" className="shrink-0">
              <Download className="size-4 mr-2" />
              Export CSV
            </Button>

            {!user && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAccountClick?.()}
                className="shrink-0"
              >
                <LogIn className="size-4 mr-2" />
                Login
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <User className="size-4 mr-2" />
                    {visibleUserName}
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
                      <DropdownMenuItem
                        onClick={() => {
                          onAdminClick?.();
                        }}
                      >
                        <Shield className="size-4 mr-2" />
                        Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
    </>
  );
}
