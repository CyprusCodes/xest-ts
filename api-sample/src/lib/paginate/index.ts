import fetchResources from "./fetchResourcePaginated";
import FILTERS from "./fetchResourcePaginated/constants/filtersList";
import {
  PaginatedResult,
  PaginationOptions
} from "./fetchResourcePaginated/types";

const paginate = ({
  baseTable,
  basePath,
  selectFields,
  joinStatements = [],
  sortableAttributes = [],
  filterableAttributes = [],
  sortBy,
  groupBy = [],
  limit = 50,
  page = null,
  direction = "next",
  onRowReady,
  onPageResultsReady,
  filters,
  cursorValues,
  mandatoryFilter
}: PaginationOptions): Promise<PaginatedResult> => {
  return fetchResources({
    baseTable,
    selectFields,
    joinStatements,
    sortableAttributes,
    filterableAttributes,
    sortBy,
    groupBy,
    limit,
    page,
    direction,
    filters,
    cursorValues,
    basePath,
    onRowReady,
    onPageResultsReady,
    mandatoryFilter
  });
};

export { paginate, FILTERS };
