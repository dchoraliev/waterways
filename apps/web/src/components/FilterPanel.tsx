// no top-level React import needed for JSX with the automatic runtime
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Filter, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  DEFAULT_FILTER_OPTIONS,
  hasActiveObservationFilters,
  type FilterOptions,
} from '@waterways/shared';

export type { FilterOptions };

interface Project {
  id: string;
  name: string;
  active?: boolean;
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  observationTypes: string[];
  projects: Project[];
}

export function FilterPanel({
  filters,
  onFilterChange,
  observationTypes,
  projects,
}: FilterPanelProps) {
  const { user } = useAuth();
  // panel open state not required currently
  console.log('projects data:', projects);

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
    onFilterChange(DEFAULT_FILTER_OPTIONS);
  };

  const hasActiveFilters = hasActiveObservationFilters(filters);

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

      {/* Projects */}
      {user && (
        <div className="space-y-2">
          <Label htmlFor="projectFilter">Projects</Label>

          <Select
            value={filters.myProjects || 'all'}
            onValueChange={(value) => handleFilterChange('myProjects', value)}
          >
            <SelectTrigger id="projectFilter">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>

              {projects.length === 0 ? (
                <SelectItem value="none" disabled>
                  No projects yet
                </SelectItem>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="dateFrom">Date range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
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
    </Card>
  );
}
