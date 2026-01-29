import { submitQuery, getInsertId } from "~root/lib/database";

interface UpdateRecoveryDateParams {
  email: string;
}

/**
 * Updates the recovery request table to mark a specific email's request as used.
 */
const updateRecoveryDate = ({ email }: UpdateRecoveryDateParams) => submitQuery`
  UPDATE password_recovery_requests
  SET recovered_at = CURRENT_TIMESTAMP
  WHERE requested_email = ${email};
`;

/**
 * Using getInsertId here typically returns the rows affected or the ID
 * of the updated record depending on your database utility implementation.
 */
export default getInsertId(updateRecoveryDate) as (
  params: UpdateRecoveryDateParams
) => Promise<number>;
