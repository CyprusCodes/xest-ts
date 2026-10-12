import qs, { IStringifyOptions } from "qs";
import encodeCursorValues from "./encodeCursorValues";
import {
  FilterableAttribute,
  FilterCriteria,
  PageInfo,
  SortCriteria
} from "../types";

interface GetPageInfoOptions {
  numberOfRecordSelected: number;
  totalRecordCount: number;
  totalUnlimitedRecordCount: number;
  limit: number | string;
  page: string | null;
  direction: string;
  records: any[];
  filterableAttributes: FilterableAttribute[];
  sortableAttributes: string[];
  orderBy: SortCriteria[];
  filters?: FilterCriteria;
  basePath: string;
}

function convertSortCriteriaToQueryParams(
  sortCriteria: SortCriteria[]
): string {
  const queryParams = sortCriteria
    .map((criteria) => {
      const direction = criteria.direction.toUpperCase() === "DESC" ? "-" : "";
      return `${direction}${criteria.column}`;
    })
    .join(",");

  return `${queryParams}`;
}

const getPageInfo = ({
  numberOfRecordSelected,
  totalRecordCount,
  totalUnlimitedRecordCount,
  limit,
  page,
  direction,
  records,
  filterableAttributes,
  sortableAttributes,
  orderBy,
  filters,
  basePath
}: GetPageInfoOptions): PageInfo => {
  let from: number;
  let to: number;
  if (numberOfRecordSelected === 0) {
    from = 0;
    to = 0;
  } else if (page === "last") {
    from = totalRecordCount - numberOfRecordSelected + 1;
    to = totalRecordCount;
  } else if (direction === "next") {
    from = totalRecordCount - totalUnlimitedRecordCount + 1;
    to = from + numberOfRecordSelected - 1;
  } else if (direction === "previous") {
    to = totalUnlimitedRecordCount;
    from = to - numberOfRecordSelected + 1;
  } else {
    from = 1;
    to = from + numberOfRecordSelected - 1;
  }

  const sortCriteria = convertSortCriteriaToQueryParams(orderBy);
  let baseLink = `${basePath}?page_size=${limit}&sort_by=${sortCriteria}`;
  if (filters) {
    const filterString = qs.stringify({ filters }, {
      encode: false,
      queryPrefix: "filters",
      arrayFormat: "indices"
    } as IStringifyOptions);
    baseLink = `${baseLink}&${filterString}`;
  }
  const firstLink = `${baseLink}&page=first`;
  const lastLink = `${baseLink}&page=last`;

  let selfLink: string;
  if (page === "last") {
    selfLink = lastLink;
  } else {
    selfLink = baseLink;
  }

  let previousLink: string | null = null;
  let startCursor: string | null = null;
  if (from > 1) {
    const referenceRecord = records[0];
    startCursor = encodeCursorValues(referenceRecord, orderBy);
    previousLink = `${baseLink}&direction=previous&cursor=${startCursor}`;
  }

  let nextLink: string | null = null;
  let endCursor: string | null = null;
  if (to < totalRecordCount && numberOfRecordSelected !== 0) {
    const referenceRecord = records[numberOfRecordSelected - 1];
    endCursor = encodeCursorValues(referenceRecord, orderBy);
    nextLink = `${baseLink}&direction=next&cursor=${endCursor}`;
  }

  return {
    pageSize: limit,
    from,
    to,
    total: totalRecordCount,
    hasNextPage: Boolean(nextLink),
    hasPreviousPage: Boolean(previousLink),
    filterableAttributes,
    sortableAttributes,
    startCursor,
    endCursor,
    links: {
      self: selfLink,
      first: firstLink,
      previous: previousLink,
      next: nextLink,
      last: lastLink
    }
  };
};

export default getPageInfo;
