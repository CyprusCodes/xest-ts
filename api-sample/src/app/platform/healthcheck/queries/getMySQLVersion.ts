import { submitQuery, getFirst } from "~root/lib/database";

const getMySQLVersion = () => submitQuery`
    SELECT VERSION() as version;
`;

export default getFirst(getMySQLVersion, "version") as () => Promise<string>;
