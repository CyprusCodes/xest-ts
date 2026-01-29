import { Request, Response } from "express";
import modifyPassword from "~root/actions/password-recovery/modifyPassword";
import handleApiError from "~root/utils/handleAPIError";
import modifyRecoveryDate from "~root/actions/password-recovery/modifyRecoveryDate";
import fetchRecoveryRequest from "~root/actions/password-recovery/fetchRecoveryRequest";
import {
  putPasswordSchema,
  PutPasswordTicket
} from "./schemas/putPasswordSchema";

const putPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, password, confirmPassword } = req.body;
  const { shortcode } = req.params;

  try {
    // 1. Fetch the recovery request to get the 'requestedEmail'
    const { requestedEmail } = await fetchRecoveryRequest({ email, shortcode });

    // 2. Validate input. We cast to Required to ensure fields exist for actions.
    const validatedData = (await putPasswordSchema.validate(
      { email, password, confirmPassword, requestedEmail },
      { abortEarly: false }
    )) as Required<PutPasswordTicket>;

    // 3. Update the password
    const { userId } = await modifyPassword({
      email: validatedData.email,
      password: validatedData.password
    });

    // 4. Mark the recovery as used (Update recovery date)
    await modifyRecoveryDate({ email: validatedData.email });

    // 5. Send success response
    res.status(200).send({
      userId
    });
  } catch (err) {
    handleApiError(res, err);
  }
};

export default putPassword;
