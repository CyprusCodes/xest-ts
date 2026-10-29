import { submitQuery, getFirst } from "~root/lib/database";

const selectPassword = ({
  password,
  email
}: {
  password: string;
  email: string;
}) => submitQuery`
    SELECT password
    FROM users 
    WHERE password = SHA2(CONCAT(${password},${process.env.PASSWORD_SALT}), 224) AND email = ${email}
`;

export default getFirst(selectPassword, "password") as (params: {
  password: string;
  email: string;
}) => Promise<string | null>;
