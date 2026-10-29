import getTableNames from "./queries/getTableNames";

async function getTables(all = false): Promise<{ tableName: string }[]> {
  const tableNames = await getTableNames();
  if (all) {
    return tableNames;
  }
  return tableNames.filter((t) => !t.tableName.includes("_xest_backup"));
}

export default getTables;
