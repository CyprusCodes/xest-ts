import { submitQuery, sql, sqlId, sqlReduce } from "~root/lib/database";
import unlimitedQuery from "./unlimitedQuery";
import {
  Cursor,
  FilterableAttribute,
  FilterCriteria,
  SortCriteria
} from "../types";

interface EscapedString extends String {
  _escaped_before?: symbol;
}

interface SelectResourceOptions {
  baseTable: string;
  selectFields: string[];
  joinStatements: string[];
  groupBy: string[];
  orderBy: SortCriteria[];
  page: string | null;
  direction: string;
  filters?: FilterCriteria;
  cursorValues: Cursor[];
  limit: number | string;
  filterableAttributes: FilterableAttribute[];
  mandatoryFilter?: string;
}

const selectResource = ({
  baseTable,
  selectFields,
  joinStatements,
  groupBy,
  orderBy,
  page,
  direction,
  filters,
  cursorValues,
  limit,
  filterableAttributes,
  mandatoryFilter
}: SelectResourceOptions): Promise<any[]> => {
  const query = sql`
    SELECT
      ${selectFields
        .map((field) => {
          // eslint-disable-next-line no-underscore-dangle
          if ((field as EscapedString)._escaped_before) {
            return field;
          }
          return sql`${sqlId(field)} `;
        })
        .reduce(sqlReduce)}
    FROM
      ${sqlId(baseTable)}
      ${
        joinStatements.length
          ? sql`${joinStatements.reduce((a, c) => sql`${a} ${c}`)}`
          : sql``
      }
      ${unlimitedQuery({
        groupBy,
        orderBy,
        page,
        direction,
        filters,
        cursorValues,
        filterableAttributes,
        mandatoryFilter
      })}
      LIMIT ${Number(limit)}
      `;

  // this subquery keeps sort order of each page consistent
  // regardless of pagination direction
  return submitQuery`
  SELECT * FROM(${query}) AS subquery
  ORDER BY
  ${orderBy
    .map((o) => sql`subquery.${sqlId(o.column.split(".")[1])} ${o.direction}`)
    .reduce(sqlReduce)}`;
};

export default selectResource;
