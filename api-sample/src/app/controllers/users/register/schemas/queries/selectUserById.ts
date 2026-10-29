import { submitQuery, camelKeys, getFirst } from "~root/lib/database";

const selectUserByEmail = ({ email }: { email: string }) => submitQuery`
    SELECT 
      user_id
    FROM users
    WHERE email=${email};
`;

export default getFirst(camelKeys(selectUserByEmail)) as (params: {
  email: string;
}) => Promise<{ userId: number } | null>;
