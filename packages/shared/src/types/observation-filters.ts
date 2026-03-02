export interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  types: string[];
  keywords: string;
  myProjects: string;
}

export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  dateFrom: '',
  dateTo: '',
  types: [],
  keywords: '',
  myProjects: 'all',
};

export function hasActiveObservationFilters(filters: FilterOptions): boolean {
  return Boolean(
    filters.dateFrom ||
    filters.dateTo ||
    filters.types.length > 0 ||
    filters.keywords.trim() ||
    filters.myProjects !== 'all'
  );
}
