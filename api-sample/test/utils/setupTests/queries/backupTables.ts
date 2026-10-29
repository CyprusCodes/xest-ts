import { submitQuery, sqlId } from "~root/lib/database";

const backupTable = ({ tableName }: { tableName: string }) => submitQuery`
    CREATE TABLE ${sqlId(`${tableName}_xest_backup`)} LIKE ${sqlId(tableName)};
    INSERT INTO ${sqlId(`${tableName}_xest_backup`)} SELECT * FROM ${sqlId(
  tableName
)};
`;

export default backupTable;
