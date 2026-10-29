// Import the value/class from yup
import { ValidationError } from "yup";

// Create the type manually by getting the InstanceType of the constructor
type ValidationErrorType = InstanceType<typeof ValidationError>;

export interface FormFieldError {
  path: string;
  message: string;
}

/**
 * Type Guard to handle the older Yup version structure
 */
function isYupError(err: any): err is ValidationErrorType {
  return (
    err && (err instanceof ValidationError || err.name === "ValidationError")
  );
}

const parseYupError = (
  err: unknown
): FormFieldError[] | Record<string, never> => {
  if (isYupError(err)) {
    // Now 'err' is typed as ValidationErrorType
    const isSingleError =
      err.inner?.length === 0 && !!err.path && !!err.message;

    if (isSingleError) {
      return [
        {
          path: err.path as string,
          message: err.message
        }
      ];
    }

    return err.inner.map((item: any) => ({
      path: (item.path as string) || "",
      message: item.message
    }));
  }

  return {};
};

export default parseYupError;
