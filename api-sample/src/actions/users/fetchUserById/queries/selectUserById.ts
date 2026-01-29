import { submitQuery, camelKeys, getFirst } from "~root/lib/database";
import { UserProfile } from "../index";

const selectUserById = ({ userId }: { userId: number | string }) => submitQuery`
    SELECT 
        users.user_id,
        users.first_name,
        users.last_name,
        user_types.user_type_id,
        user_types.user_type
    FROM users
    LEFT JOIN user_types ON users.user_type_id = user_types.user_type_id
    WHERE users.user_id = ${userId}
`;

// camelKeys converts snake_case to camelCase
// getFirst ensures we return a single object (UserProfile) instead of an array
export default getFirst(camelKeys(selectUserById)) as (params: {
  userId: number | string;
}) => Promise<UserProfile | null>;
