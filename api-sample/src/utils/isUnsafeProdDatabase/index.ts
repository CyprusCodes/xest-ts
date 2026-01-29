/**
 * Utility to determine if the current database connection is
 * potentially dangerous (Production host without Production environment flag).
 */
const isUnsafeProdDbConn = (): boolean => {
  const dbHost = process.env.DB_HOST || "";
  const appEnv = process.env.APP_ENVIRONMENT;
  const nodeEnv = (process.env.NODE_ENV || "").toUpperCase();

  const dbIsNotLocal = !["localhost", "127.0.0.1"].includes(dbHost);
  const appEnvIsNotProd = appEnv !== "PRODUCTION";
  const isTestRun = nodeEnv === "TEST";

  if (dbIsNotLocal && isTestRun) {
    /* eslint-disable no-console */
    console.warn(
      "SECURITY WARNING: You are trying to run tests against a remote MySQL Instance!"
    );
    return true;
  }

  if (dbIsNotLocal && appEnvIsNotProd) {
    return true;
  }

  if (dbIsNotLocal) {
    console.info("NOTICE: RUNNING AGAINST PRODUCTION DATABASE!");
  }

  return false;
};

export default isUnsafeProdDbConn;
