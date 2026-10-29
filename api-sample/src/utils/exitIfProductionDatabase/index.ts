import isUnsafeProdDbConn from "../isUnsafeProdDatabase";

/**
 * Checks if the current database connection is pointing to production
 * while the app environment is not explicitly set to PRODUCTION.
 * Prevents accidental data wipes during migrations or seeds.
 */
const exitIfProdDb = (): void => {
  if (isUnsafeProdDbConn()) {
    /* eslint-disable no-console */
    console.warn("-------------------------------------------------------");
    console.error("CRITICAL ERROR: DB_HOST IS SET TO PRODUCTION");
    console.warn("You might be making a BIG MISTAKE.");
    console.warn(
      "If you want to continue, set ENVIRONMENT VARIABLE: APP_ENVIRONMENT=PRODUCTION"
    );
    console.warn("-------------------------------------------------------");
    /* eslint-enable no-console */

    process.exit(1);
  }
};

export default exitIfProdDb;
