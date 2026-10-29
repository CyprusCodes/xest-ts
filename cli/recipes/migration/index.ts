import inquirer from "inquirer";
import kebabCase from "lodash/kebabCase";
import { execSync } from "child_process";
import inquirerFileTreeSelection from "inquirer-file-tree-selection-prompt";
inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);
import chalk from "chalk";
import { Recipe } from "../types";

const migrationRecipe: Recipe<string> = {
  name: "migration", // MUST match directory name
  userPrompt: () => {
    const lastElement = process.argv[process.argv.length - 1];
    let migrationName: string | null = null;

    if (lastElement !== "migration" && lastElement !== "new") {
      migrationName = lastElement;
    }

    if (!migrationName) {
      return inquirer
        .prompt({
          type: "input",
          name: "migrationName",
          validate: (input) => Boolean(input.trim()),
          message:
            "What is changing with this migration? E.g: drop-payment-id-field",
        })
        .then((response) => {
          return { migrationName: kebabCase(response.migrationName) };
        });
    }
    return Promise.resolve({ migrationName: kebabCase(migrationName) });
  },
  files: [
    {
      source: "queries/insert.js",
      targetFileNameMapper: ({ projectRootPath, userVariables }) => {
        const { migrationName } = userVariables;

        execSync(`npm run migrate:new ${migrationName}`, {
          cwd: projectRootPath,
          stdio: "inherit",
        });

        // return null so transformation is skipped;
        return null;
      },
      targetFileWriter: async () => {},
    },
  ],
};

export default migrationRecipe;
