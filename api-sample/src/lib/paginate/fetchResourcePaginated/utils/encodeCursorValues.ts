import camelCase from "lodash/camelCase";
import { Cursor, SortCriteria } from "../types";

function encodeCursorValues(
  referenceRecord: any,
  orderBy: SortCriteria[]
): string {
  const cursorObj: Cursor[] = orderBy.map((o) => {
    const column = o.column.split(".")[1];
    const value = referenceRecord[column]
      ? referenceRecord[column]
      : referenceRecord[camelCase(column)];
    return { column: o.column, value };
  });
  return Buffer.from(JSON.stringify(cursorObj)).toString("base64");
}

export default encodeCursorValues;
