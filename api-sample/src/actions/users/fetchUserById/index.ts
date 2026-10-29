import selectUserById from "./queries/selectUserById";

export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  userTypeId: number;
  userType: string;
}

interface FetchUserByIdResponse {
  user: UserProfile | null;
}

const fetchUserById = async ({
  userId
}: {
  userId: number | string;
}): Promise<FetchUserByIdResponse> => {
  const user = await selectUserById({ userId });

  return { user };
};

export default fetchUserById;
