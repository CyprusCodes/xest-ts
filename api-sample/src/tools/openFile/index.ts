import { exec } from "child_process";

function getCommandLine(): string {
  switch (process.platform as string) {
    case "darwin":
      return "open";
    case "win32":
      return "start";
    case "win64":
      return "start";
    default:
      return "xdg-open";
  }
}

exec(`${getCommandLine()} ${process.argv[2]}`);
