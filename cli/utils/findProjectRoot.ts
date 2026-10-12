import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import finder from "find-package-json";

const findProjectRoot = (): finder.FoundPackage | false => {
  let found = false;
  let f = finder(process.cwd());
  let projectRoot: finder.FindResult | { done: boolean } = { done: false };
  while (!found && projectRoot.done === false) {
    projectRoot = f.next();
    found = !isEmpty(get(projectRoot, "value.xest", {}));
  }

  if (found) {
    return projectRoot as finder.FoundPackage;
  }
  return false;
};

export default findProjectRoot;
