/* eslint-disable no-console */
import isEqual from "lodash/isEqual";
import sinon from "sinon";
import jsonDiff from "json-diff";
import sortDeep from "../../../src/utils/sortDeep";

const deepEqualInAnyOrder = (expectation: unknown) =>
  sinon.match((object) => {
    const sortedValue = sortDeep(object);
    const sortedExpectation = sortDeep(expectation);
    const result = isEqual(sortedValue, sortedExpectation);
    if (result) {
      return true;
    }
    console.log(
      `Expected value and given value do not match. Please investigate:`
    );
    console.log(jsonDiff.diffString(sortedValue, sortedExpectation));
    return false;
  }, "spy was not called with expected arguments");

export default deepEqualInAnyOrder;
