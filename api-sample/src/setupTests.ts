import "module-alias/register";
import path from "path";
import dotenv from "dotenv";
import isUnsafeProdDbConn from "~root/utils/isUnsafeProdDatabase";

dotenv.config({
  path: path.join(__dirname, "../.env")
});

// eslint-disable-next-line no-undef
describe("Database Check", () => {
  const isUnsafe = isUnsafeProdDbConn();
  it("should not run against production database", () => {
    expect(isUnsafe).toBe(false);
  });
});
