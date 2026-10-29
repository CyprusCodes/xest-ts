import inquirer from "inquirer";
import chalk from "chalk";
import detect from "detect-port";
import { kill, killer } from "cross-port-killer";
import { execSync } from "child_process";

const resolvePortConflict = async (
  portToCheck: number,
  serviceName: string,
  isNodemon: boolean = false,
  projectName?: string
): Promise<void> => {
  const port = await detect(portToCheck);
  if (Number(port) !== portToCheck) {
    const results: any = await inquirer.prompt([
      {
        type: "confirm",
        message: chalk.red`Can not start ${serviceName}, another process is occupying port ${portToCheck}. Do you want to stop this process?`,
        name: "resolvePortConflict",
        default: 0,
        choices: [
          {
            index: 0,
            key: "Y",
            name: "Yes",
            value: true,
          },
          {
            index: 1,
            key: "N",
            name: "No",
            value: false,
          },
        ],
      },
    ]);
    const { resolvePortConflict } = results;
    if (resolvePortConflict) {
      const out = execSync(
        `docker container ls --format "{{.ID}}\t{{.Names}}\t{{.Ports}}"`
      ).toString();
      if (out.includes(portToCheck as unknown as string)) {
        const containerId = out.split("\t")[0];
        execSync(`docker stop ${containerId}`);
      } else {
        if (isNodemon) {
          // nuclear option for nodemon tasks
          // because they spawn child processes
          const out = execSync(
            `ps -x | grep "[n]odemon app.js" | grep ${projectName}`
          ).toString();
          const processIds = out
            .split("\n")
            .map((row) => row.replace(/\s/g, " "))
            .map((row) => row.split(" "))
            .map((row) => row[0])
            .filter((row) => Boolean(row));

          await killer.killByPids(processIds);
        } else {
          await kill(portToCheck);
        }
        await kill(portToCheck);
      }
    }
  }
};

export default resolvePortConflict;
