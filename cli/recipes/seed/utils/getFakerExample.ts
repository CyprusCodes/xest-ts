import faker from "@faker-js/faker";
import isEmpty from "lodash/isEmpty";

const parseColumnTypeArgs = (columnType: string): string[] => {
  // https://stackoverflow.com/a/36195444
  const match = columnType.match(/(?:\()(.+)+(?:\))/);

  if (!match) {
    return [];
  }

  return match[1].split(/[\s,]+/).filter(function (e) {
    return e;
  });
};

const trimSampleOutput = (output: string): string => {
  let string = output.replace(/  |\r\n|\n|\r/gm, "").replace(/\\"/g, '"');
  if (string.length > 80) {
    return string.substring(0, 77) + "...";
  }
  return string;
};

const getFakerExample = (methodToCall: string): string => {
  try {
    const out = getFakerValue(methodToCall);
    return trimSampleOutput(out);
  } catch (error) {
    console.error("CLI failed to generate seed data.");
    console.log(error);
    return "";
  }
};

const getFakerValue = (methodToCall: string): any => {
  const out = faker.fake(`{{${methodToCall}}}`);
  if (methodToCall.includes("lorem.words")) {
    let trim = out.replace(/  |\r\n|\n|\r/gm, "").replace(/\\"/g, '"');
    const [size]: any = parseColumnTypeArgs(methodToCall);
    return trim.substring(0, size);
  }

  const isDate = !isEmpty(out.match(/(\d{2}:){2}\d{2}/));
  if (isDate) {
    const date = new Date(out);
    return date.toISOString();
  }

  return out.replace(/\"/g, ""); // strip "
};

export { getFakerExample, getFakerValue };
