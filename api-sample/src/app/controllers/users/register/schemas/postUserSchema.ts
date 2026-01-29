import * as yup from "yup";
import selectUserByEmail from "./queries/selectUserById";

export const postUserSchema = yup.object().shape({
  firstName: yup
    .string()
    .required()
    .label("First Name"),
  lastName: yup
    .string()
    .required()
    .label("Last Name"),
  password: yup
    .string()
    .min(8)
    .required()
    .label("Password"),
  userTypeId: yup
    .number()
    .required()
    .label("User Type ID")
    .typeError("User Type ID must be a number."),
  email: yup
    .string()
    .email()
    .required()
    .label("Email")
    .test("doesEmailExist", "User account already exists.", async (email) => {
      if (!email) return true;
      const account = await selectUserByEmail({ email });
      return !account; // Returns true if account doesn't exist (validation passes)
    })
});

// This extracts the TypeScript type directly from the schema!
export type PostUserTicket = yup.InferType<typeof postUserSchema>;