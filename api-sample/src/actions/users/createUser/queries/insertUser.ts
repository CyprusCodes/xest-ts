import { submitQuery, getInsertId } from "~root/lib/database";
import { CreateUserParams } from "../index";

const insertUser = ({
  firstName,
  lastName,
  email,
  password,
  userTypeId
}: CreateUserParams) => {
  const salt = process.env.PASSWORD_SALT;

  if (!salt) {
    throw new Error("PASSWORD_SALT is missing in environment variables");
  }

  return submitQuery`
    INSERT INTO users
    (
      first_name,
      last_name,
      email,
      password,
      user_type_id
    )
    VALUES
    (
      ${firstName},
      ${lastName},
      ${email},
      SHA2(CONCAT(${password}, ${salt}), 224),
      ${userTypeId}
    )
  `;
};

export default getInsertId(insertUser);
