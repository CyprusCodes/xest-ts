#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { program } from "commander";
import chalk from "chalk";

import {
  generate,
  run,
  fresh,
  applyRecipe,
  diagram,
  ai,
  deploy,
} from "./cli/commands/index";

const readPackageJson = (): { description: string; version: string } => {
  const candidates = [
    path.join(__dirname, "..", "package.json"),
    path.join(__dirname, "package.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }
  throw new Error("Unable to locate the xest package.json");
};

const { description, version } = readPackageJson();

program
  .command("start [appname]", { isDefault: true })
  .description("scaffold a new Xest API project")
  .action(generate(program));

program.command("run").description("run your Xest project").action(run);

program
  .command("fresh")
  .description(
    chalk.blueBright`a fresh run of your project with MySQL data cleared and re-initialized.`
  )
  .addHelpText(
    "after",
    chalk.yellow`
Starts your MySQL container instance, runs seed data and other migrations if necessary.\nIt will then spawn an Express API using nodemon for local development.`
  )
  .action(fresh);

program
  .command("new [recipe]")
  .description("Create new resources with Xest interactive wizard.")
  .action(applyRecipe);

program
  .command("diagram")
  .alias("dia")
  .description("View your database diagram in your web browser")
  .action(diagram);

program
  .command("ai")
  .description("Use XestGPT to assist with general development tasks")
  .action(ai);

program
  .command("deploy")
  .description("Deploy your xest project")
  .action(deploy);

program
  .description(description)
  .version(version, "-v, --version")
  .parse(process.argv);
