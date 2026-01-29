import * as yup from "yup";
import selectEmail from "./queries/selectEmail";

export const postRecoveryRequestSchema = yup.object().shape({
  requestedEmail: yup
    .string()
    .required()
    .email()
    .label("Email")
    .test("doesEmailExist", "Email must exist.", async (requestedEmail) => {
      if (!requestedEmail) return false;
      const email = await selectEmail({ requestedEmail });
      return !!email; // Passes validation if the email exists in the DB
    })
});

export type PostRecoveryTicket = yup.InferType<
  typeof postRecoveryRequestSchema
>;
