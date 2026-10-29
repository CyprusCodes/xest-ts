import { submitQuery, camelKeys, getFirst } from "~root/lib/database";

interface SelectRecoveryParams {
  email: string;
  shortcode: string;
}

const selectRecoveryRequest = ({
  email,
  shortcode
}: SelectRecoveryParams) => submitQuery`
    SELECT
        requested_email,
        shortcode,
        recovered_at,
        expiry_date,
        created_at
    FROM
        password_recovery_requests
    WHERE 
        requested_email = ${email}
        AND shortcode = ${shortcode}
        AND NOW() < expiry_date
        AND recovered_at IS NULL
    ORDER BY created_at DESC
`;

/**
 * getFirst with the second argument "requestedEmail"
 * extracts only that field from the first record found.
 */
export default getFirst(camelKeys(selectRecoveryRequest), "requestedEmail") as (
  params: SelectRecoveryParams
) => Promise<string | null>;
