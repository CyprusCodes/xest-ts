import get from "lodash/get";
import type { AzimuttDiagram, AzimuttTable } from "../syncDatabaseDiagram";

const getPreviousColumnComment = (
  tableName: string,
  columnName: string,
  previousDiagramJSON: AzimuttDiagram
): string | false | undefined => {
  const tables: AzimuttTable[] = get(
    previousDiagramJSON,
    "sources.0.tables",
    []
  );
  const table = tables.find((table) => table.table === tableName);
  if (table) {
    const columns = table.columns;
    const column = columns.find((c) => c.name === columnName);
    if (column) {
      return column.comment;
    }
  }
  return false;
};

export default getPreviousColumnComment;
