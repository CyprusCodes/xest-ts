import { Liquid } from "liquidjs";
const engine = new Liquid();
import enrichEngineWithFilter from "./filters/index";
import enrichEngineWithTags from "./tags/index";

const render = async (template: string, context: any): Promise<string> => {
  enrichEngineWithFilter(engine);
  enrichEngineWithTags(engine);
  return engine.parseAndRender(template, context);
};

export default render;
