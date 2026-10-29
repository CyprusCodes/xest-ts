import { submitQuery, sqlId } from "~root/lib/database";

const backupTable = ({ tableName }: { tableName: string }) => submitQuery`
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE ${sqlId(tableName)};
    INSERT INTO ${sqlId(tableName)} SELECT * FROM ${sqlId(
  `${tableName}_xest_backup`
)};
    SET FOREIGN_KEY_CHECKS = 1;
`;

export default backupTable;
