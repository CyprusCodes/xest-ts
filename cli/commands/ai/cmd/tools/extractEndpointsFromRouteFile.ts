import * as acorn from "acorn";
import * as traverse from "@babel/traverse";

export interface Endpoint {
  route: string;
  method: string;
  controllerName: string;
  controllerPath: string;
}

interface Controller {
  functionName: string;
  functionPath: string;
}

const extractEndpointsFromRouteFile = (contents: string): Endpoint[] => {
  // run through acorn
  const routesFileAST = acorn.parse(contents, { ecmaVersion: "2020" as any });
  let routes: Endpoint[] = [];
  let controllers: Controller[] = [];

  traverse.default(routesFileAST as any, {
    VariableDeclaration(path) {
      if (
        path.node.kind === "const" &&
        path.node.declarations &&
        path.node.declarations[0] &&
        path.node.declarations[0].init &&
        path.node.declarations[0].init.type === "CallExpression" &&
        (path.node.declarations[0].init.callee as any).name === "require"
      ) {
        const functionName = (path.node.declarations[0].id as any).name;
        const functionPath = (
          path.node.declarations[0].init.arguments[0] as any
        ).value;
        controllers.push({ functionName, functionPath });
      }
    },
    CallExpression(path) {
      const { callee, arguments: argsArr } = path.node as any;
      if (
        callee.type === "MemberExpression" &&
        callee.object &&
        callee.object.name === "router"
      ) {
        const routeMethod = callee.property.name;
        const route = argsArr[0].value;
        const functionName = argsArr[argsArr.length - 1].name;
        const cntrllr = controllers.find(
          (c) => c.functionName === functionName
        );
        routes.push({
          route,
          method: routeMethod,
          controllerName: functionName,
          controllerPath: cntrllr ? cntrllr.functionPath : "",
        });
      }
    },
  });

  return routes;
};

export default extractEndpointsFromRouteFile;
