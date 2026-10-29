import express from "express";
import chalk from "chalk";
import cors from "cors";
import localtunnel from "localtunnel";
import findProjectRoot from "../../utils/findProjectRoot";
import commandsList, { XestTool } from "./cmd/index";

const XESTGPT_PORT = 1313;

const ai = () => {
  // ai only works at Xest project root
  const projectDetails = findProjectRoot();
  if (!projectDetails) {
    console.log(
      chalk.red`You are not within a Xest project directory. Please check your current path directory.`
    );
    return;
  }

  const app = express();
  app.use(cors());

  app.use(express.json({ limit: "100mb" }));

  app.get("/cmnd-tools", (req, res) => {
    const getTools = () => {
      const toolsMapped = commandsList.map((t) => {
        return {
          name: t.name,
          description: t.description,
          jsonSchema: t.parameters,
          isDangerous: t.dangerous,
          functionType: t.functionType,
          isLongRunningTool: false,
          rerun: t.rerun,
          rerunWithDifferentParameters: t.rerunWithDifferentParameters,
          prerequisites: t.prerequisites,
        };
      });
      return { tools: toolsMapped };
    };

    const toolsResponse = getTools();
    res.json(toolsResponse);
  });

  app.post("/run-cmnd-tool", async (req, res) => {
    const args = req.body;
    const toolToRun = commandsList.find(
      (t) => t.name === args.toolName
    ) as XestTool;
    const results = await toolToRun.runCmd(args.props);
    res.send(results);
  });

  app.listen(XESTGPT_PORT, () => {
    localtunnel({ port: XESTGPT_PORT }).then((tunnel) => {
      console.log(
        chalk.green`XestGPT CMND Extension is available on ${tunnel.url}`
      );

      tunnel.on("close", () => {
        console.log(
          chalk.red`XestGPT CMND Extension link has expired. Restart xx ai`
        );
      });
    });
  });
};

export { ai };
