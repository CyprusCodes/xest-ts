import { submitQuery } from "~root/lib/database";
import { ModifyUserParams } from "../index";

const updateUserDetails = ({
  userId,
  firstName,
  lastName,
  password
}: Omit<ModifyUserParams, "jobTitle">) => {
  const salt = process.env.PASSWORD_SALT;

  if (!salt) {
    throw new Error("PASSWORD_SALT is missing in environment variables");
  }

  return submitQuery`
    UPDATE users
    SET 
      first_name = ${firstName},
      last_name = ${lastName},
      password = SHA2(CONCAT(${password}, ${salt}), 224)
    WHERE user_id = ${userId};
  `;
};

export default updateUserDetails;
