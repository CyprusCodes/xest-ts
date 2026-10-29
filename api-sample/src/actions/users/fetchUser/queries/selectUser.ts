import { submitQuery, camelKeys, getFirst } from "~root/lib/database";
import { User } from "../index";

const selectUser = ({
  email,
  password
}: {
  email: string;
  password: string;
}): any => {
  const salt = process.env.PASSWORD_SALT;

  if (!salt) {
    throw new Error("PASSWORD_SALT is missing in environment variables");
  }

  return submitQuery`
    SELECT
        users.user_id,
        users.first_name,
        users.last_name,
        users.password,
        users.email,
        user_types.user_type_id,
        user_types.user_type
    FROM users
    LEFT JOIN user_types ON users.user_type_id = user_types.user_type_id
    WHERE email = ${email}
    AND password = SHA2(CONCAT(${password}, ${salt}), 224);
  `;
};

// camelKeys converts snake_case to camelCase
// getFirst ensures we return a single object (User) instead of an array
export default getFirst(camelKeys(selectUser)) as (params: {
  email: string;
  password: string;
}) => Promise<User | null>;
