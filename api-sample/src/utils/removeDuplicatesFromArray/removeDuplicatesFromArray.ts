const removeDuplicatesFromArray = <T>(arrayWithDuplictes: T[]): T[] => {
  const arrayWithoutDuplicates = Array.from(
    new Set(arrayWithDuplictes.map((item) => JSON.stringify(item))),
    JSON.parse as (value: string) => T
  );
  return arrayWithoutDuplicates;
};

export default removeDuplicatesFromArray;
