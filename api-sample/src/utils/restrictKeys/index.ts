const restrictKeys = <T extends object>(
  obj: T,
  restrictedKeys: string[]
): T => {
  const keys = Object.keys(obj);
  const containsRestrictedKey = restrictedKeys.some((r) =>
    keys.find((k) => r === k)
  );
  if (containsRestrictedKey) {
    throw new Error("Object contains restricted key.");
  }
  return obj;
};

export default restrictKeys;
