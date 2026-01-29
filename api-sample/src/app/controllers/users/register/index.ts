import { Request, Response } from "express";
import createUser from "~root/actions/users/createUser";
import handleAPIError from "~root/utils/handleAPIError";
import { postUserSchema, PostUserTicket } from "./schemas/postUserSchema";


const postUser = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const validatedBody = (await postUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })) as Required<PostUserTicket>;

    const { user } = await createUser({
      firstName: validatedBody.firstName,
      lastName: validatedBody.lastName,
      email: validatedBody.email,
      password: validatedBody.password,
      userTypeId: validatedBody.userTypeId
    });

    res.status(201).send({
      user
    });
  } catch (err) {
    handleAPIError(res, err);
  }
};

export default postUser;
