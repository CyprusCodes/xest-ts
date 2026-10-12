import { submitQuery, sqlId, sql, getFirst } from "~root/lib/database";
import unlimitedQuery from "./unlimitedQuery";
import {
  Cursor,
  FilterableAttribute,
  FilterCriteria,
  SortCriteria
} from "../types";

interface CountUnlimitedOptions {
  baseTable: string;
  joinStatements: string[];
  groupBy: string[];
  orderBy: SortCriteria[];
  page: string | null;
  direction: string;
  filters?: FilterCriteria;
  cursorValues: Cursor[];
  filterableAttributes: FilterableAttribute[];
  mandatoryFilter?: string;
}

const countUnlimited = ({
  baseTable,
  joinStatements,
  groupBy,
  orderBy,
  page,
  direction,
  filters,
  cursorValues,
  filterableAttributes,
  mandatoryFilter
}: CountUnlimitedOptions): Promise<any[]> => submitQuery`
  SELECT
    COUNT(*) AS count_unlimited_rows
  FROM(
    SELECT 
      1
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
  ) AS unlimited_query
`;

export default getFirst(countUnlimited, "count_unlimited_rows");
