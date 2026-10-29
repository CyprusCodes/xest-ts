import selectUser from "./queries/selectUser";

// Defining the shape of the user returned by camelKeys
export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  userTypeId: number;
  userType: string;
  password?: string;
}

interface FetchUserResponse {
  user: User | null;
}

const fetchUser = async ({
  email,
  password
}: {
  email: string;
  password: string;
}): Promise<FetchUserResponse> => {
  const user = await selectUser({ email, password });

  return { user };
};

export default fetchUser;
