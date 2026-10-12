import chalk from "chalk";
import inquirer from "inquirer";
import allRecipes from "../recipes/index";
import type { FileDescriptor, Recipe, UserVariables } from "../recipes/types";
import asyncSeries from "../utils/asyncSeries";
import findProjectRoot from "../utils/findProjectRoot";
import path from "path";

interface ExecuteRecipeArgs {
  recipeToApply: Recipe<any>;
  projectRootPath: string;
  projectName: string;
  argv?: string[];
}

const executeRecipe = async ({
  recipeToApply,
  projectRootPath,
  projectName,
}: ExecuteRecipeArgs): Promise<void> => {
  const recipeDirectory = recipeToApply.name;
  const userVariables = await recipeToApply.userPrompt(projectRootPath);
  await asyncSeries(recipeToApply.files, async (file: FileDescriptor<any>) => {
    const baseTemplatePath = path.join(
      __dirname,
      "../recipes/",
      recipeDirectory
    );
    const sourceFileName = path.basename(file.source);
    const sourceFilePath = path.join(baseTemplatePath, "template", file.source);
    const sourceFileParentDirectory = path.dirname(sourceFilePath);

    const targetFilePath = await file.targetFileNameMapper({
      sourceFileName,
      sourceFilePath,
      sourceFileRelative: file.source,
      sourceFileParentDirectory,
      projectRootPath,
      projectName,
      userVariables: userVariables as UserVariables,
    });
    if (targetFilePath !== null) {
      await file.targetFileWriter({
        sourceFileName,
        sourceFilePath,
        sourceFileParentDirectory,
        projectRootPath,
        projectName,
        userVariables: userVariables as UserVariables,
        targetFilePath,
      });
    }
  });

  if (recipeToApply.postGeneration) {
    await recipeToApply.postGeneration();
  }
};

const applyRecipe = async (): Promise<void> => {
  const projectDetails = findProjectRoot();
  if (!projectDetails) {
    console.log(
      chalk.red`You are not within a Xest project directory. Please check your current path directory.`
    );
    return;
  }

  const projectName = projectDetails.value.name as string;

  const { filename } = projectDetails;
  const projectRootPath = path.dirname(filename);

  const subcommandIndex = process.argv.findIndex((arg) => arg === "new");
  const recipeName = process.argv[subcommandIndex + 1];
  const recipeToApply = allRecipes.find((recipe) => recipe.name === recipeName);

  if (recipeToApply) {
    await executeRecipe({
      recipeToApply,
      projectName,
      projectRootPath,
      argv: process.argv,
    });
    return;
  }

  // user might have made a typo
  if (recipeName && !recipeToApply) {
    console.log(
      chalk.red`No recipe found for ${recipeName}, reverting to wizard.`
    );
  }

  const { recipeType: recipeChosen } = await inquirer.prompt({
    type: "list",
    name: "recipeType",
    message: "What would you like to generate?",
    choices: allRecipes.map((recipe) => recipe.name),
  });
  const recipe = allRecipes.find((recipe) => recipe.name === recipeChosen);
  await executeRecipe({
    recipeToApply: recipe!,
    projectName,
    projectRootPath,
    argv: process.argv,
  });
};

export { applyRecipe };
