import insertRecoveryRequest from "./queries/insertRecoveryRequest";

export interface RecoveryRequestParams {
  requestedEmail: string;
  URLshortcode: string;
}

interface CreateRecoveryResponse {
  requestId: number;
}

/**
 * Action to initiate a password recovery record.
 */
const createRecoveryRequest = async ({
  requestedEmail,
  URLshortcode
}: RecoveryRequestParams): Promise<CreateRecoveryResponse> => {
  const requestId = await insertRecoveryRequest({
    requestedEmail,
    URLshortcode
  });

  return { requestId };
};

export default createRecoveryRequest;
