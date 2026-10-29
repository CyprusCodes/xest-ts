declare module "request-promise/errors" {
  class RequestError extends Error {
    cause: any;

    error: any;

    options: any;

    response: any;

    constructor(cause: any, options?: any, response?: any);
  }
  class StatusCodeError extends Error {
    statusCode: number;

    error: any;

    options: any;

    response: any;

    constructor(statusCode: number, body: any, options?: any, response?: any);
  }
  class TransformError extends Error {
    cause: any;

    error: any;

    options: any;

    response: any;

    constructor(cause: any, options?: any, response?: any);
  }
  const errors: {
    RequestError: typeof RequestError;
    StatusCodeError: typeof StatusCodeError;
    TransformError: typeof TransformError;
  };
  export = errors;
}
