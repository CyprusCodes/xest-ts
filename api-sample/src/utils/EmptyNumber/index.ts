/* eslint-disable func-names */
import * as yup from "yup";

// https://github.com/jquense/yup/issues/298#issuecomment-508346424
// Helper to validate the numbers that can be empty string
const EmptyNumber = (
  typeErrorMessage: string = "Please enter a valid number"
): yup.NumberSchema<number | null | undefined> => {
  return yup
    .number()
    .transform(function (value, originalValue) {
      if (this.isType(value)) return value;
      if (!originalValue || !originalValue.trim()) {
        return null;
      }
      // we return the invalid original value
      return originalValue;
    })
    .nullable(true)
    .typeError(typeErrorMessage);
};

export default EmptyNumber;
