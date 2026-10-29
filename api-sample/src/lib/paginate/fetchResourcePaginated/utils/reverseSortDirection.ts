import { sql } from "~root/lib/database";

const revertSortDirection = (direction: string): string => {
  const checkDirectionStr = direction.toString();
  if (checkDirectionStr === "ASC") {
    return sql`DESC`;
  }

  if (checkDirectionStr === "DESC") {
    return sql`ASC`;
  }

  throw new Error(`Unknown sort direction ${direction}`);
};

export default revertSortDirection;
