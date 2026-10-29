import { submitQuery } from "~root/lib/database";

const getTableNames = (): Promise<{ tableName: string }[]> => submitQuery`
    SELECT 
    table_name as tableName 
    FROM information_schema.TABLES 
    WHERE table_schema = "{{PROJECT_NAME_SNAKECASE}}_db";
`;

export default getTableNames;
