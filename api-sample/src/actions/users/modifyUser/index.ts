import updateUserDetails from "./queries/updateUserDetails";

export interface ModifyUserParams {
  userId: number | string;
  firstName: string;
  lastName: string;
  password: string;
  jobTitle?: string; // Included as it was used in your previous putUserDetails controller
}

interface ModifyUserResponse {
  userDetails: any; // Usually the database result object (affectedRows, etc.)
}

const modifyUser = async ({
  userId,
  firstName,
  lastName,
  password
}: ModifyUserParams): Promise<ModifyUserResponse> => {
  const userDetails = await updateUserDetails({
    userId,
    firstName,
    lastName,
    password
  });

  return { userDetails };
};

export default modifyUser;
