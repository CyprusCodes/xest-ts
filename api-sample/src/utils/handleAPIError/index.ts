import { Response } from "express";
import { ValidationError } from "yup";
import monitoring from "~root/utils/monitoring";
import parseYupError from "~root/utils/parseYupError";
import { BAD_REQUEST, ERROR } from "~root/constants/HttpStatusCodes";

const GENERIC_ERROR_MESSAGE = "API Error";

/**
 * Global API Error Handler
 * Handles Yup validation errors specifically and logs unexpected errors.
 */
const handleAPIError = (
  res: Response,
  err: unknown,
  statusCode: number = ERROR
): void => {
  if (!(err instanceof ValidationError)) {
    // Cast to any or Error for logging if it's an unexpected type
    monitoring.error(err as any);

    res.status(statusCode).send(GENERIC_ERROR_MESSAGE);
    return;
  }

  // If it is a Yup ValidationError
  res.status(BAD_REQUEST).send(parseYupError(err));
};

export default handleAPIError;
