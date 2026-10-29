import chipper from "chipper/prog";
import flattenDeep from "lodash/flattenDeep";
import get from "lodash/get";
import * as fs from "fs";

export interface ChipperOptions {
  alias: string[];
  silenceConsole: boolean;
  projectRoot: string;
  outputFormat: string;
  rescan: boolean;
}

function filterNonExistentFilesAndSystemDependencies(filePaths: string[]) {
  const existingFiles = filePaths.filter((filePath) => fs.existsSync(filePath));

  return existingFiles;
}

const scanDependencies = async (
  path: string,
  depth = 0,
  maxDepth: number,
  chipperOpts: ChipperOptions
): Promise<string[]> => {
  const results = await chipper.exec(["dependencies", path], chipperOpts);

  const dependents = get(results, "[0].importedModules", []) as Array<{
    absolute: string;
  }>;
  let fileResults: string[][] = [];

  if (dependents.length && depth < maxDepth) {
    fileResults = await Promise.all(
      dependents.map((d) =>
        scanDependencies(d.absolute, depth + 1, maxDepth, chipperOpts)
      )
    );
  }

  const allResults = [
    ...dependents.map((d) => d.absolute),
    ...flattenDeep(fileResults),
  ];

  const filteredResults =
    filterNonExistentFilesAndSystemDependencies(allResults);
  return Promise.resolve(filteredResults);
};

export default scanDependencies;
