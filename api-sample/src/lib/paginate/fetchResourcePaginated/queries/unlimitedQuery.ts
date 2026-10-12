import { sql, sqlId, sqlReduce } from "~root/lib/database";
import revertSortDirection from "../utils/reverseSortDirection";
import generateMultiColumnPaginationCursor from "../utils/generateMultiColumnPaginationCursor";
import baseQuery from "./baseQuery";
import {
  Cursor,
  FilterableAttribute,
  FilterCriteria,
  SortCriteria
} from "../types";

interface UnlimitedQueryOptions {
  groupBy: string[];
  orderBy: SortCriteria[];
  page: string | null;
  direction: string;
  filters?: FilterCriteria;
  cursorValues: Cursor[];
  filterableAttributes: FilterableAttribute[];
  mandatoryFilter?: string;
}

const unlimitedQuery = ({
  groupBy,
  orderBy,
  page,
  direction,
  filters,
  cursorValues,
  filterableAttributes,
  mandatoryFilter
}: UnlimitedQueryOptions): string => {
  let query = baseQuery({
    filters,
    filterableAttributes,
    mandatoryFilter
  });

  if (page === "last") {
    query = sql`
      ${query}  
      ${
        groupBy.length
          ? sql`GROUP BY ${groupBy.map((c) => sqlId(c)).reduce(sqlReduce)}`
          : sql``
      }
      ORDER BY
        ${orderBy
          .map(
            (o) => sql`${sqlId(o.column)} ${revertSortDirection(o.direction)}`
          )
          .reduce(sqlReduce)}`;
  } else if (cursorValues.length && direction === "next") {
    query = sql`
      ${query}  
      ${generateMultiColumnPaginationCursor({
        direction,
        cursorValues,
        orderBy
      })}
      ${
        groupBy.length
          ? sql`GROUP BY ${groupBy.map((c) => sqlId(c)).reduce(sqlReduce)}`
          : sql``
      }
      ORDER BY
        ${orderBy
          .map((o) => sql`${sqlId(o.column)} ${o.direction}`)
          .reduce(sqlReduce)}`;
  } else if (cursorValues.length && direction === "previous") {
    query = sql`
      ${query} 
      ${generateMultiColumnPaginationCursor({
        direction,
        cursorValues,
        orderBy
      })}
      ${
        groupBy.length
          ? sql`GROUP BY ${groupBy.map((c) => sqlId(c)).reduce(sqlReduce)}`
          : sql``
      }
      ORDER BY
        ${orderBy
          .map(
            (o) => sql`${sqlId(o.column)} ${revertSortDirection(o.direction)}`
          )
          .reduce(sqlReduce)}`;
  } else {
    query = sql`
      ${query}
      ${
        groupBy.length
          ? sql`GROUP BY ${groupBy.map((c) => sqlId(c)).reduce(sqlReduce)}`
          : sql``
      }
      ORDER BY
        ${orderBy
          .map((o) => sql`${sqlId(o.column)} ${o.direction}`)
          .reduce(sqlReduce)}`;
  }

  return query;
};

export default unlimitedQuery;
