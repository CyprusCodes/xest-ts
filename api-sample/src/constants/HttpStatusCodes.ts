/**
 * Standardized HTTP Status Codes for the API
 */
export enum HttpStatusCodes {
  OK = 200,
  BAD_REQUEST = 400,
  INVALID_CREDENTIALS = 401,
  ERROR = 500
}

// Alternatively, for cleaner imports in your existing code:
export const OK = HttpStatusCodes.OK;
export const BAD_REQUEST = HttpStatusCodes.BAD_REQUEST;
export const INVALID_CREDENTIALS = HttpStatusCodes.INVALID_CREDENTIALS;
export const ERROR = HttpStatusCodes.ERROR;
