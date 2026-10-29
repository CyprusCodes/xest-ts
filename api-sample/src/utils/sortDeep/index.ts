import sortAny from "sort-any";
import mapValues from "lodash/mapValues";

const sortDeep = (object: unknown): unknown => {
  if (!Array.isArray(object)) {
    if (!(typeof object === "object") || object === null) {
      return object;
    }

    return mapValues(object, sortDeep);
  }

  return sortAny(object.map(sortDeep));
};

export default sortDeep;
