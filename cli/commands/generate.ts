import "inquirer";
import snakeCase from "lodash/snakeCase";
import kebabCase from "lodash/kebabCase";
import chalk from "chalk";
import findProjectRoot from "../utils/findProjectRoot";
import { writeFile, writeDirectory } from "../utils/createFile";
import asyncSeries from "../utils/asyncSeries";
import writeDotEnvFile from "../utils/writeDotEnvFile";
import writeDatabaseJSONFile from "../utils/writeDatabaseJSONFile";
import writeGitIgnoreFile from "../utils/writeGitIgnoreFile";
import fs from "fs";
import path from "path";
import { fdir } from "fdir";
import { replaceInFile as replace } from "replace-in-file";
import execa from "execa";
import { Command } from "commander";

const generate =
  (program: Command) =>
  async (appName?: string): Promise<void> => {
    const projectRoot = findProjectRoot();
    if (projectRoot) {
      console.log(
        chalk.red`You are already in a Xest project directory. No need to scaffold a new API. Exiting.`
      );

      program.outputHelp();
      return;
    }

    if (!appName) {
      console.log("Please provide a project name"); // todo: get project name with inquirer
      return;
    }

    const appNameSnakeCase = snakeCase(appName);
    const appNameKebapCase = kebabCase(appName);
    const sampleProjectRootDirectory = path.join(
      __filename,
      "../../../",
      "api-sample/"
    );
    const projectDirectoryToCreate = path.join(process.cwd(), appNameKebapCase);

    if (!fs.existsSync(projectDirectoryToCreate)) {
      fs.mkdirSync(projectDirectoryToCreate, { recursive: true });
    }

    const sourceProjectFiles = new fdir()
      .withBasePath()
      .withDirs()
      .crawl(sampleProjectRootDirectory)
      .sync() as string[];

    const filesWritten: string[] = [];
    await asyncSeries(sourceProjectFiles, async (sourceFilePath: string) => {
      const isFile = fs.lstatSync(sourceFilePath).isFile();
      const isDirectory = fs.lstatSync(sourceFilePath).isDirectory();
      const target = sourceFilePath.replace(
        sampleProjectRootDirectory,
        `${projectDirectoryToCreate}/`
      );
      if (isFile) {
        const sourceFileContent = fs.readFileSync(sourceFilePath);
        await writeFile(target, sourceFileContent as unknown as string);
        filesWritten.push(target);
      }
      if (isDirectory) {
        await writeDirectory(target);
      }
    });

    console.log(chalk.green`${filesWritten.length} modules created.`);
    await replace({
      files: filesWritten,
      from: [/{{PROJECT_NAME_SNAKECASE}}/g, /{{PROJECT_NAME_KEBAPCASE}}/g],
      to: [appNameSnakeCase, appNameKebapCase],
    });

    console.log(chalk.green`Installing packages...`);
    await writeDotEnvFile(projectDirectoryToCreate, appNameSnakeCase);
    await writeDatabaseJSONFile(projectDirectoryToCreate, appNameSnakeCase);
    await writeGitIgnoreFile(projectDirectoryToCreate);
    await execa(`npm install --legacy-peer-deps`, {
      cwd: projectDirectoryToCreate,
      shell: true,
    });
    console.log(
      chalk.green`You're ready to go!\n Type ${chalk.green`cd ${appNameKebapCase} && xx run`} to begin.`
    );
  };

export { generate };
