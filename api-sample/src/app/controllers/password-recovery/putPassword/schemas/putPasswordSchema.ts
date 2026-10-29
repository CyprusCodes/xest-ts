import * as yup from "yup";
import selectEmail from "./queries/selectEmail";
import selectPassword from "./queries/selectPassword";

export const putPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .required()
    .email()
    .label("Email")
    .test("doesEmailExist", "Email must exist", async function (email) {
      const { requestedEmail } = this.parent;
      if (email !== requestedEmail) {
        return false;
      }
      const emailFound = await selectEmail({ email });
      return !!emailFound;
    }),
  password: yup
    .string()
    .required()
    .min(8)
    .label("Password")
    .test("doesPasswordsMatch", "Passwords should match.", function (password) {
      const { confirmPassword } = this.parent;
      return password === confirmPassword;
    })
    .test(
      "doesPasswordsNotMatchWithThePreviousPassword",
      "Password shouldn't be same as your previous password.",
      async function (password) {
        const { email } = this.parent;
        if (!email || !password) return true;
        const isPasswordTheSameAsBefore = await selectPassword({
          email,
          password
        });
        return !isPasswordTheSameAsBefore;
      }
    ),
  confirmPassword: yup.string().required(), // Added to schema for full typing
  requestedEmail: yup.string().required() // Added to schema for full typing
});

export type PutPasswordTicket = yup.InferType<typeof putPasswordSchema>;
