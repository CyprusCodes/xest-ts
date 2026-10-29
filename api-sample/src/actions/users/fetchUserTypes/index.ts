import selectUserTypes from "./queries/selectUserTypes";

export interface UserType {
  userType: string;
}

interface FetchUserTypesResponse {
  userTypes: UserType[];
}

const fetchUserTypes = async (): Promise<FetchUserTypesResponse> => {
  const userTypes = await selectUserTypes();

  return { userTypes };
};

export default fetchUserTypes;
