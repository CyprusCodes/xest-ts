import insertUser from "./queries/insertUser";

// Defining the interface here or in a central types file
export interface CreateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userTypeId: number;
}

interface CreateUserResponse {
  user: {
    insertId: number;
  };
}

const createUser = async ({
  firstName,
  lastName,
  email,
  password,
  userTypeId
}: CreateUserParams): Promise<CreateUserResponse> => {
  const user = await insertUser({
    firstName,
    lastName,
    email,
    password,
    userTypeId
  });

  return { user };
};

export default createUser;
