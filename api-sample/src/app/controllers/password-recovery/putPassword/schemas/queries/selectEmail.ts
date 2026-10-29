import { submitQuery, getFirst } from "~root/lib/database";

const selectEmail = ({ email }: { email: string | undefined }) => submitQuery`
    SELECT email
    FROM users 
    WHERE email = ${email} 
`;

export default getFirst(selectEmail, "email") as (params: {
  email: string | undefined;
}) => Promise<string | null>;
