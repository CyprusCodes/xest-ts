import { groupBy, omit } from "lodash";

/**
 * Interface for defining how a flat row should be nested.
 */
export interface NestTransformation {
  mergeField: string; // The unique ID field to group by (e.g., 'id')
  childrenLabel: string; // The key name for the nested array (e.g., 'items')
  fieldsToKeep: string[]; // Other fields at this level to preserve (e.g., 'name', 'date')
}

/**
 * Recursively nests flat tabular data based on a set of transformations.
 */
const nest = (
  results: any[],
  transformationsToApply: NestTransformation[],
  fieldsToOmit: string[] = []
): any[] => {
  // Return empty array if no results to process
  if (!results.length) return [];

  const transClone = [...transformationsToApply];
  const transformation = transClone.shift();

  if (!transformation) {
    return results.map(v => omit(v, fieldsToOmit));
  }

  const { mergeField, childrenLabel, fieldsToKeep } = transformation;
  const groupedResult = groupBy(results, mergeField);

  // We add current level fields to the omission list for deeper levels
  const nextFieldsToOmit = [...fieldsToOmit, ...fieldsToKeep, mergeField];

  return Object.entries(groupedResult).map(([key, value]) => {
    // If the key is 'null' (as a string from Object.entries),
    // we keep it as null or the original key type
    const typedKey = key === "null" ? null : key;

    return {
      [mergeField]: typedKey,
      ...fieldsToKeep.reduce((acc: any, keyToKeep) => {
        acc[keyToKeep] = value[0][keyToKeep];
        return acc;
      }, {}),
      [childrenLabel]: transClone.length
        ? nest(value, transClone, nextFieldsToOmit)
        : value.map(v => omit(v, nextFieldsToOmit))
    };
  });
};

export default nest;
