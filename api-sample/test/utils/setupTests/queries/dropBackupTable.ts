import { submitQuery, sqlId } from "~root/lib/database";

const backupTable = ({ tableName }: { tableName: string }) => submitQuery`
    DROP TABLE ${sqlId(`${tableName}_xest_backup`)};
`;

export default backupTable;
