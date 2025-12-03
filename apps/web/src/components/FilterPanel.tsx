// no top-level React import needed for JSX with the automatic runtime
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Filter, X } from 'lucide-react';

export interface FilterOptions {
  year: string;
  month: string;
  types: string[];
  keywords: string;
  myProjects: string;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  observationTypes: string[];
}

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

export function FilterPanel({ filters, onFilterChange, observationTypes }: FilterPanelProps) {
  // panel open state not required currently

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const clearFilters = () => {
    onFilterChange({
      year: '',
      month: '',
      types: [],
      keywords: '',
      myProjects: '',
    });
  };

  const hasActiveFilters =
    filters.year ||
    filters.month ||
    filters.types.length > 0 ||
    filters.keywords ||
    filters.myProjects;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="size-5" />
          <h2>Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Select
            value={filters.year || 'all'}
            onValueChange={(value: string) =>
              handleFilterChange('year', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger id="year">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select
            value={filters.month || 'all'}
            onValueChange={(value: string) =>
              handleFilterChange('month', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger id="month">
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
        </div>

        <div className="space-y-2">
          <Label>Observation Types</Label>
          <div className="space-y-2 border border-input rounded-md p-3 max-h-48 overflow-y-auto">
            {observationTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.types.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                />
                <label htmlFor={`type-${type}`} className="text-sm cursor-pointer flex-1">
                  {type}
                </label>
              </div>
            ))}
          </div>
          {filters.types.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {filters.types.length} type{filters.types.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            placeholder="Search observations..."
            value={filters.keywords}
            onChange={(e) => handleFilterChange('keywords', e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
