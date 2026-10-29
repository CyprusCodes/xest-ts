const stringifyOrNullify = <T>(array: T[]): string | null => {
  if (array.length > 0) {
    return JSON.stringify(array);
  }
  return null;
};

export default stringifyOrNullify;
