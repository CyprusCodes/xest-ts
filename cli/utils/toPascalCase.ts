import { camelCase, startCase } from "lodash";

const toPascalCase = (str: string): string =>
  startCase(camelCase(str)).replace(/ /g, "");

export default toPascalCase;
