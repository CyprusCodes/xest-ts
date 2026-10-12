import memoize from "lodash/memoize";
import jwt from "jsonwebtoken";
import fetchUserById from "~root/actions/users/fetchUserById";

const getJWT = async (userId = 1) => {
  const { user } = await fetchUserById({ userId });

  const accessToken = jwt.sign({ ...user }, process.env.JWT_SECRET as string, {
    expiresIn: "1d"
  });

  return accessToken;
};

export default memoize(getJWT, (userId) => userId);
