import { Response } from "express";
import jwt from "jsonwebtoken";
import fetchUserById from "~root/actions/users/fetchUserById";
import modifyUser from "~root/actions/users/modifyUser";
import handleAPIError from "~root/utils/handleAPIError";

import { Request } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string | number;
    [key: string]: any;
  };
}

const putUserDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  const { userId } = req.user;
  const { firstName, lastName, password } = req.body;

  try {
    const { userDetails } = await modifyUser({
      userId,
      firstName,
      lastName,
      password
    });

    const { user } = await fetchUserById({
      userId
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing from environment variables");
    }

    // Generate a fresh token with the updated user data
    const accessToken = jwt.sign({ ...user }, secret, {
      expiresIn: "365d" // 1 year
    });

    res.send({
      userDetails,
      accessToken
    });
  } catch (err) {
    handleAPIError(res, err);
  }
};

export default putUserDetails;