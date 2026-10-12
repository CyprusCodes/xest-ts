const isLocalOrTestEnvironment = (): boolean => {
  const inTestMode = process.env.NODE_ENV === "test";
  const islocalDB = process.env.DB_HOST === "localhost";

  if (inTestMode || islocalDB) {
    return true;
  }
  return false;
};

export default isLocalOrTestEnvironment;
