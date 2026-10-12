import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import findProjectRoot from "../../utils/findProjectRoot";
import chalk from "chalk";
import syncDatabaseDiagram from "./utils/syncDatabaseDiagram";
import type { AzimuttDiagram } from "./utils/syncDatabaseDiagram";

interface ProjectRoot {
  filename: string;
}

const diagram = (): void => {
  // diagram only works at Xest project root
  const projectDetails = findProjectRoot() as unknown as ProjectRoot | false;
  if (!projectDetails) {
    console.log(
      chalk.red`You are not within a Xest project directory. Please check your current path directory.`
    );
    return;
  }

  const { filename } = projectDetails;
  const rootPath = path.dirname(filename);
  syncDatabaseDiagram({ rootPath });

  const app = express();

  app.use(express.json({ limit: "100mb" }));
  app.use(express.static(path.join(__dirname, "static")));

  // required for hard refresh
  app.get("/00000000-0000-0000-0000-000000000000", (req, res) => {
    res.redirect("/");
  });

  // required for hard refresh
  app.get(
    "/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000",
    (req, res) => {
      res.redirect("/");
    }
  );

  // required for hard refresh
  app.get("/new", (req, res) => {
    res.redirect("/");
  });

  app.get("/db-diagram.json", (req, res) => {
    let azimuttJSON: Partial<AzimuttDiagram> = {};

    try {
      const azimuttJSONRaw = fs.readFileSync(
        path.join(rootPath, "./db-diagram.json")
      );
      azimuttJSON = JSON.parse(azimuttJSONRaw as unknown as string);
    } catch (error) {
      console.log(
        chalk.red`You don't have db-diagram.json file available in your project root. Did you forget to run? xx fresh`
      );
    }

    res.send(azimuttJSON);
  });

  app.post("/post", (req, res) => {
    const azimuttJSON: AzimuttDiagram = req.body;

    try {
      fs.writeFileSync(
        path.join(rootPath, "./db-diagram.json"),
        JSON.stringify(azimuttJSON, null, 2)
      );
    } catch (error) {
      console.log(
        chalk.red`Something went wrong while saving db-diagram.json file.`
      );
    }

    res.send({});
  });

  app.listen(7373, () => {
    console.log(
      chalk.green`Xest Database Diagram is available on http://localhost:7373`
    );
    var start =
      process.platform == "darwin"
        ? "open"
        : process.platform == "win32"
        ? "start"
        : "xdg-open";
    exec(start + " http://localhost:7373");
  });
};

export { diagram };
