import fs from "fs";
import { Request, Response } from "express";
import handleAPIError from "~root/utils/handleAPIError";
import getMySQLVersion from "./queries/getMySQLVersion";

const healthcheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const mysqlVersion = await getMySQLVersion();

    // Using readFileSync; we cast to string to ensure type safety
    const appVersion: string = fs
      .readFileSync("./COMMIT_HASH")
      .toString()
      .trim();

    res.status(200).send({ mysqlVersion, appVersion });
  } catch (err) {
    handleAPIError(res, err);
  }
};

export default healthcheck;
