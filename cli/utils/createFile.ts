import mkdirp from "mkdirp";
import fs from "fs";
import { dirname as getDirName } from "path";

function writeFile(path: string, contents: string): Promise<void> {
  return mkdirp(getDirName(path)).then((res) => {
    fs.writeFileSync(path, contents);
  });
}

function writeDirectory(path: string): Promise<string | undefined> {
  return mkdirp(getDirName(path)).then((res) => {
    return res;
  });
}

export { writeFile, writeDirectory };
