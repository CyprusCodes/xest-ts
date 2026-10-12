import { execSync } from "child_process";

const prettifyFile = (filePath: string): Buffer => {
  return execSync(`npx prettier --write "${filePath}"`, {
    stdio: "inherit",
  });
};

export default prettifyFile;
