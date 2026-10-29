import {
  submitQuery,
  getFirst,
  sqlId,
  sqlReduce,
  sql
} from "~root/lib/database";
import baseQuery from "./baseQuery";
import { FilterableAttribute, FilterCriteria } from "../types";

interface CountTotalOptions {
  baseTable: string;
  joinStatements: string[];
  filters?: FilterCriteria;
  filterableAttributes: FilterableAttribute[];
  groupBy: string[];
  mandatoryFilter?: string;
}

const countTotal = ({
  baseTable,
  joinStatements,
  filters,
  filterableAttributes,
  groupBy,
  mandatoryFilter
}: CountTotalOptions): Promise<any[]> => submitQuery`
SELECT
  COUNT(*) AS total_count
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
  ${baseQuery({
    filters,
    filterableAttributes,
    mandatoryFilter
  })}
  ${
    groupBy.length
      ? sql`GROUP BY ${groupBy.map((c) => sqlId(c)).reduce(sqlReduce)}`
      : sql``
  }
) AS base_query`;

export default getFirst(countTotal, "total_count");
