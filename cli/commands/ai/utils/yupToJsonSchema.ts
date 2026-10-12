import * as yup from "yup";
import { convertSchema } from "@sodaru/yup-to-json-schema";

const yupToJsonSchema = (schema: yup.AnySchema) => {
  const jsonSchema = convertSchema(schema);

  if (!jsonSchema["properties"]) {
    return {
      ...jsonSchema,
      properties: {},
      required: [],
    };
  }

  return jsonSchema;
};

export default yupToJsonSchema;
