import updatePassword from "./queries/updatePassword";

interface ModifyPasswordParams {
  email: string;
  password: string;
}

interface ModifyPasswordResponse {
  userId: number;
}

/**
 * Action to update a user's password during the recovery process.
 */
const modifyPassword = async ({
  email,
  password
}: ModifyPasswordParams): Promise<ModifyPasswordResponse> => {
  const userId = await updatePassword({
    email,
    password
  });

  return { userId };
};

export default modifyPassword;
