import { useState } from 'react';
import { FilterOptions } from './FilterPanel';
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
import { Download, User, LogOut, LogIn, ChevronDown, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SignIn } from '../pages/SignIn';
import { SignUp } from '../pages/SignUp';
import { toast } from 'sonner';
import { WaveIcon } from './WaveIcon';

interface HeaderProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  observationTypes: string[];
  filteredCount: number;
  totalCount: number;
  onExportCSV: () => void;
  onAccountClick?: () => void;
  filteredUserId?: string | null;
  filteredUserName?: string;
  onClearUserFilter?: () => void;
  onDailyReportClick?: () => void;
  projects?: string[];
}

type AuthDialog = 'signin' | 'signup' | null;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const years = ['2024', '2025'];

console.log('useAuth user:', User);

export function Header({
  filters,
  onFilterChange,
  observationTypes,
  filteredCount,
  totalCount,
  onExportCSV,
  onAccountClick,
  filteredUserId,
  filteredUserName,
  onClearUserFilter,
  onDailyReportClick,
  projects,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  if (user && (!projects || projects.length === 0)) {
    console.log('Header: user has no projects in context', user.id, user.name, projects);
  }
  const [authDialog, setAuthDialog] = useState<AuthDialog>(null);

  const handleFilterChange = (key: keyof FilterOptions, value: string | boolean) => {
    onFilterChange({ ...filters, [key]: value } as FilterOptions);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
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

  return (
    <>
      <header className="bg-blue-200 border-b">
        <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <WaveIcon className="size-8 text-blue-700" />
            <h1>Waterways Observation System</h1>
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <Button variant="default" size="sm" onClick={() => onAccountClick?.()}>
                <LogIn className="size-4 mr-2" />
                Login
              </Button>
            )}

            {user && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="size-4 mr-2" />
                      {user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[2000]">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p>{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="size-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-muted/30">
          {filteredUserId && filteredUserName && (
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm bg-blue-100 text-blue-900 px-3 py-1 rounded-full flex items-center gap-2">
                <User className="size-4" />
                Filtering by: {filteredUserName}
                <button
                  onClick={onClearUserFilter}
                  className="ml-1 hover:bg-blue-200 rounded-full size-5 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Select
                value={filters.year || 'all'}
                onValueChange={(value: string) =>
                  handleFilterChange('year', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.month || 'all'}
                onValueChange={(value: string) =>
                  handleFilterChange('month', value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[180px] justify-between bg-background font-normal"
                  >
                    {getTypeFilterLabel()}
                    <ChevronDown className="size-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                  <DropdownMenuLabel>Observation Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
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
                  {filters.types.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onFilterChange({ ...filters, types: [] })}>
                        Clear selection
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Input
                placeholder="Search keywords..."
                value={filters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                className="w-[200px] bg-background"
              />

              <Select
                value={filters.myProjects || 'all'}
                onValueChange={(value: string) => handleFilterChange('myProjects', value)}
              >
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects && projects.length > 0 ? (
                    projects.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No projects yet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredCount} of {totalCount} observations
              </div>
              <Button onClick={onDailyReportClick} variant="outline" size="sm">
                <CalendarDays className="size-4 mr-2" />
                Daily Report
              </Button>
              <Button onClick={handleExportClick} variant="outline" size="sm">
                <Download className="size-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

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
