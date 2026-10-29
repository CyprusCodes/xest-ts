import snakeCase from "lodash/snakeCase";
import chalk from "chalk";
import findProjectRoot from "../utils/findProjectRoot";
import runMySQLContainer from "../utils/runMySQLContainer";
import { dirname } from "path";
import runSqlQueryWithinContainer from "../utils/runSqlQueryWithinContainer";
import { run } from "./run";

const fresh = async (): Promise<void> => {
  const projectDetails = findProjectRoot();
  if (!projectDetails) {
    console.log(
      chalk.red`You are not within a Xest project directory. Please check your current path directory.`
    );
    return;
  }

  const projectName = projectDetails.value.name as string;

  const { filename } = projectDetails;
  const rootPath = dirname(filename);

  // make sure mysql container is up and running
  const mySQLContainerId = await runMySQLContainer(rootPath, projectName);
  if (!mySQLContainerId) {
    return;
  }

  let error: any;
  let output: any;
  console.log(chalk.yellow`Dropping database ${snakeCase(projectName)}_db`);
  const dropDatabaseQuery = `drop database ${snakeCase(projectName)}_db`;
  const mySQLConnectionString = `mysql -h localhost -u root -ppassword ${snakeCase(
    projectName
  )}_db`;
  const dropDatabaseCmd = `printf "${dropDatabaseQuery}" | docker exec -i ${mySQLContainerId} ${mySQLConnectionString}`;
  ({ error, output } = await runSqlQueryWithinContainer(dropDatabaseCmd));
  if (error) {
    console.log(
      chalk.red`Error: dropping database ${snakeCase(projectName)}_db`
    );
  }

  console.log(chalk.yellow`Creating database ${snakeCase(projectName)}_db`);
  const createDatabaseQuery = `create database ${snakeCase(projectName)}_db`;
  const mySQLConnectionString2 = `mysql -h localhost -u root -ppassword`;
  const createDatabaseCmd = `printf "${createDatabaseQuery}" | docker exec -i ${mySQLContainerId} ${mySQLConnectionString2}`;
  ({ error, output } = await runSqlQueryWithinContainer(createDatabaseCmd));
  if (error) {
    console.log(error);
    console.log(
      chalk.red`Error: creating database ${snakeCase(projectName)}_db`
    );
  }

  await run();
};

export { fresh };
