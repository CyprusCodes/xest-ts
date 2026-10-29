import * as yup from "yup";

const extendYupSchema = (
  targetSchema: yup.AnyObjectSchema,
  extensions: Record<string, yup.AnySchema>
): yup.AnyObjectSchema => {
  return targetSchema.clone().concat(yup.object().shape(extensions));
};

export default extendYupSchema;
