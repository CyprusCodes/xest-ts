import get from "lodash/get";
import type { AzimuttDiagram, AzimuttTable } from "../syncDatabaseDiagram";

const getPreviousTableComment = (
  tableName: string,
  previousDiagramJSON: AzimuttDiagram
): string | false | undefined => {
  const tables: AzimuttTable[] = get(
    previousDiagramJSON,
    "sources.0.tables",
    []
  );
  const table = tables.find((table) => table.table === tableName);
  if (table) {
    return table.comment;
  }
  return false;
};

export default getPreviousTableComment;
