export interface FilterDefinition {
  operator: string;
  description: string;
  minimumNumberOfOperands: number;
  maximumNumberOfOperands: number;
}

export interface FilterOperation extends FilterDefinition {
  filterFn?: (values: any[]) => string;
}

export interface FilterableAttribute {
  column: string;
  operations: FilterOperation[];
}

export interface FilterCriteria {
  [key: string]: any;
  column?: string;
  operation?: string | null;
  AND?: FilterCriteria[];
  OR?: FilterCriteria[];
  length?: number;
}

export interface SortCriteria {
  column: string;
  direction: string;
}

export interface Cursor {
  column: string;
  value: any;
}

export interface ValidationError {
  column?: string;
  operation?: string | null;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  cursorError?: ValidationError[];
}

export interface PageInfoLinks {
  self: string;
  first: string;
  previous: string | null;
  next: string | null;
  last: string;
}

export interface PageInfo {
  pageSize: number | string;
  from: number;
  to: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  filterableAttributes: FilterableAttribute[];
  sortableAttributes: string[];
  startCursor: string | null;
  endCursor: string | null;
  links: PageInfoLinks;
}

export interface PaginationOptions {
  baseTable: string;
  basePath: string;
  selectFields: string[];
  joinStatements?: string[];
  sortableAttributes?: string[];
  filterableAttributes?: FilterableAttribute[];
  sortBy?: string;
  groupBy?: string[];
  limit?: number | string;
  page?: string | null;
  direction?: string;
  onRowReady?: (record: any, index: number) => any;
  onPageResultsReady?: (records: any[]) => any;
  filters?: FilterCriteria;
  cursorValues?: string;
  mandatoryFilter?: string;
}

export interface FetchResourcesOptions extends PaginationOptions {
  groupBy: string[];
}

export interface PaginatedResult {
  errors?: ValidationResult;
  metadata?: PageInfo;
  data?: any[];
}
