import { Cursor } from "../types";

function decodeCursorValues(encodedCursor: string): Cursor[] {
  const decodedData = Buffer.from(encodedCursor, "base64").toString("utf8");
  return JSON.parse(decodedData);
}

export default decodeCursorValues;
