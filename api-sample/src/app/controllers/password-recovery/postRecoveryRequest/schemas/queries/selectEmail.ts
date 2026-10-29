import { submitQuery, getFirst } from "~root/lib/database";

const selectEmail = ({
  requestedEmail
}: {
  requestedEmail: string;
}) => submitQuery`
    SELECT email
    FROM users 
    WHERE email = ${requestedEmail} 
`;

export default getFirst(selectEmail) as (params: {
  requestedEmail: string;
}) => Promise<{ email: string } | null>;
