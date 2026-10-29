import { submitQuery, getFirst } from "~root/lib/database";

const getUserRole = ({ userId }: { userId: string | number }) => submitQuery`
    SELECT user_type 
    FROM users
    LEFT JOIN user_types ON users.user_type_id = user_types.user_type_id
    WHERE users.user_id = ${userId}
`;

export default getFirst(getUserRole, "user_type") as (params: {
  userId: string | number;
}) => Promise<string>;
