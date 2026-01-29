import selectRecoveryRequest from "./queries/selectRecoveryRequest";

interface FetchRecoveryRequestParams {
  email: string;
  shortcode: string;
}

interface FetchRecoveryRequestResponse {
  requestedEmail: string | null;
}

const fetchRecoveryRequest = async ({
  email,
  shortcode
}: FetchRecoveryRequestParams): Promise<FetchRecoveryRequestResponse> => {
  // selectRecoveryRequest returns just the email string or null due to getFirst
  const requestedEmail = await selectRecoveryRequest({
    email,
    shortcode
  });

  return { requestedEmail };
};

export default fetchRecoveryRequest;