import * as yup from "yup";

// see medium blog https://medium.com/@ickman/making-openai-functions-reliable-dc206181afc9
// approach taken from https://github.com/Stevenic/alphawave/blob/535487b5c01fddb8c8a4cac57c07c8c859f2f780/packages/alphawave/src/JSONResponseValidator.ts#L21

// 1. missing arguments (no attributes passed)
// 2. missing JSON (no params passed)
// 3. hallucinated functions
// 'No valid JSON objects were found in the response. Return a valid JSON object.';
// 'The JSON returned had errors. Apply these fixes:';

export interface ParameterizeInput {
  arguments?: string;
  messages?: any;
  callHistory?: any;
  functionName?: string;
}

export type ParameterizeResult =
  | { parsedArgumentsSuccesfully: true; parsedArguments: any }
  | { parsedArgumentsSuccesfully: false; message: string };

export type Parameterize = (
  input: ParameterizeInput
) => Promise<ParameterizeResult>;

const getErrorFix = (error: yup.ValidationError): string => {
  switch (error.type) {
    case "typeError":
      // field is of the wrong type
      return `convert "${error.path}" to a ${error.params!.type}`;
    case "oneOf":
      // field is not one of the allowed types
      return `convert "${error.path}" to one of the allowed types in the provided schema.`;
    case "notOneOf":
      // field is not one of the allowed types
      return `convert "${error.path}" to one of the allowed types in the provided schema.`;
    case "optionality":
      // field is missing a required property
      return `add the "${error.path}" property to JSON object`;
    default:
      return `${error.message}. Fix that`;
  }
};

const validateArguments =
  (schema: yup.AnyObjectSchema): Parameterize =>
  async ({ arguments: args, messages, callHistory, functionName }) => {
    try {
      const argsToParse = args || "{}";
      const argsJson = JSON.parse(argsToParse);
      await schema.validate(argsJson, {
        abortEarly: false,
        context: { messages, callHistory },
      });
      return { parsedArgumentsSuccesfully: true, parsedArguments: argsJson };
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        // console.log(error.inner)
        const errorFixes = error.inner.map((e) => getErrorFix(e)).join(" \n");
        return {
          parsedArgumentsSuccesfully: false,
          message: `The JSON returned had errors. Apply these fixes:\n${errorFixes}`,
        };
      }

      return {
        parsedArgumentsSuccesfully: false,
        message: `No valid JSON objects were found in the response. Call the "${functionName}" with required arguments as a valid JSON object.`,
      };
    }
  };

export default validateArguments;
