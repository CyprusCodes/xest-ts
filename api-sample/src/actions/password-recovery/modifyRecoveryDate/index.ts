import updateRecoveryDate from "./queries/updateRecoveryDate";

interface ModifyRecoveryDateParams {
  email: string;
}

interface ModifyRecoveryDateResponse {
  updatedRequestId: number;
}

/**
 * Action to mark the most recent recovery request as completed.
 */
const modifyRecoveryDate = async ({
  email
}: ModifyRecoveryDateParams): Promise<ModifyRecoveryDateResponse> => {
  const updatedRequestId = await updateRecoveryDate({
    email
  });

  return { updatedRequestId };
};

export default modifyRecoveryDate;
