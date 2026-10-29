let LOGGING = true;

const setLoggingStatusTo = (newStatus: boolean): void => {
  LOGGING = newStatus;
};

const getLoggingStatus = (): boolean => {
  return LOGGING;
};

export { setLoggingStatusTo, getLoggingStatus };
