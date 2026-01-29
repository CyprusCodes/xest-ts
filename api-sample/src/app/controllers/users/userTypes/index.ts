import { Request, Response } from "express";
import fetchUserTypes from "~root/actions/users/fetchUserTypes";
import handleAPIError from "~root/utils/handleAPIError";

/**
 * Controller to fetch all user types.
 */
const getUserTypes = async (req: Request, res: Response): Promise<void> => {
  try {
   
    const { userTypes } = await fetchUserTypes();

    res.status(200).send({
      userTypes
    });
  } catch (err) {
    handleAPIError(res, err);
  }
};

export default getUserTypes;
