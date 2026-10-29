import { submitQuery, getInsertId } from "~root/lib/database";

interface UpdatePasswordParams {
  email: string;
  password: string;
}

/**
 * Updates the user's password using SHA2 encryption with a server-side salt.
 */
const updatePassword = ({ email, password }: UpdatePasswordParams) => {
  const salt = process.env.PASSWORD_SALT;

  if (!salt) {
    throw new Error("PASSWORD_SALT is missing in environment variables");
  }

  return submitQuery`
    UPDATE users
    SET password = SHA2(CONCAT(${password}, ${salt}), 224) 
    WHERE email = ${email};
  `;
};

// getInsertId usually returns the last modified ID or the ID of the affected row
export default getInsertId(updatePassword) as (
  params: UpdatePasswordParams
) => Promise<number>;
