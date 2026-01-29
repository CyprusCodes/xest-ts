import { submitQuery, camelKeys } from "~root/lib/database";
import { UserType } from "../index";

/**
 * Fetches all available user roles from the database.
 */
const selectUserTypes = () => submitQuery`
    SELECT 
        user_type
    FROM user_types
`;

// Cast the exported function to return a Promise of our UserType array
export default camelKeys(selectUserTypes) as () => Promise<UserType[]>;
