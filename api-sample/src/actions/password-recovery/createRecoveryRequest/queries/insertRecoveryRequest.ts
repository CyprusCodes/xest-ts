import { submitQuery, getInsertId } from "~root/lib/database";
import { RecoveryRequestParams } from "../index";

/**
 * Inserts a new recovery request with an 8-hour expiration.
 */
const insertRecoveryRequest = ({
  requestedEmail,
  URLshortcode
}: RecoveryRequestParams) => submitQuery`
    INSERT INTO 
      password_recovery_requests (        
      requested_email,
      shortcode,
      expiry_date
    ) VALUES (
      ${requestedEmail},
      ${URLshortcode},
      TIMESTAMPADD(HOUR, 8, CURRENT_TIMESTAMP)
    )
`;

// getInsertId ensures the function returns the ID of the new row
export default getInsertId(insertRecoveryRequest) as (
  params: RecoveryRequestParams
) => Promise<number>;
