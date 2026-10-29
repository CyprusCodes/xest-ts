/* eslint-disable no-prototype-builtins */
const objectDiff = (
  obj1: Record<string, any>,
  obj2: Record<string, any>
): Record<string, any> => {
  const diffs: Record<string, any> = {};

  const compare = (item1: any, item2: any, key: string): void => {
    if (item1 !== item2) {
      diffs[key] = item2;
    }
  };

  let key: string;

  for (key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      compare(obj1[key], obj2[key], key);
    }
  }

  for (key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (!obj1[key] && obj1[key] !== obj2[key]) {
        diffs[key] = obj2[key];
      }
    }
  }

  return diffs;
};

export default objectDiff;
