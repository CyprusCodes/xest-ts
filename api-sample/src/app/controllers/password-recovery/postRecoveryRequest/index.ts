import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import createRecoveryRequest from "~root/actions/password-recovery/createRecoveryRequest";
import handleApiError from "~root/utils/handleAPIError";
import sendEmail from "~root/lib/services/emails/sendEmail";
import {
  postRecoveryRequestSchema,
  PostRecoveryTicket
} from "./schemas/postRecoveryRequestSchema";

// Interface for the email service payload
interface EmailPayload {
  to: string;
  template: string;
  version: string;
  metadata: {
    recoveryUrl: string;
  };
}

const postRecoveryRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { requestedEmail } = req.body;

  // uuidv4() doesn't take a length argument, it generates a standard 36-char string.
  const URLshortcode = uuidv4();

  try {
    // 1. Validate the email exists
    const validatedData = (await postRecoveryRequestSchema.validate(
      { requestedEmail },
      { abortEarly: false }
    )) as Required<PostRecoveryTicket>;

    // 2. Create the record in the database
    const { requestId } = await createRecoveryRequest({
      requestedEmail: validatedData.requestedEmail,
      URLshortcode
    });

    // 3. Prepare and send the email
    const emailPayload: EmailPayload = {
      to: validatedData.requestedEmail,
      template: "recovery-email",
      version: "0.0.1",
      metadata: {
        recoveryUrl: `${process.env.APP_BASE_URL}/recover-password/${URLshortcode}`
      }
    };

    // We don't await sendEmail here so the API responds faster,
    // unless you want to ensure the email was sent before confirming to the user.
    sendEmail(emailPayload);

    res.status(200).send({
      requestId
    });
  } catch (err) {
    handleApiError(res, err);
  }
};

export default postRecoveryRequest;
