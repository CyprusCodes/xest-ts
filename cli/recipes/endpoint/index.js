const inquirer = require("inquirer");
const inquirerFileTreeSelection = require("inquirer-file-tree-selection-prompt");
inquirer.registerPrompt("file-tree-selection", inquirerFileTreeSelection);
const chalk = require("chalk");
const { getSchema, getForeignKeys } = require("../../utils/getSchema");
const useForm = require("../../components/Form");
const { flatten, toLower } = require("lodash");
const fs = require("fs");
const path = require("path");
const camelCase = require("lodash/camelCase");
const toPascalCase = require("../../utils/toPascalCase");
const { writeFile } = require("../../utils/createFile");
const render = require("../../utils/templateRenderer");
const prettifyFile = require("../../utils/prettifyFile");
const ColumnSelector = require("../../components/ColumnSelector");

let schema;
const ENDPOINT_TYPES = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
    ALL: "All of the above",
};

/**
 * Helper to generate unique names based on selected filters
 * Example: "getUsers" or "getUsersByFirstName"
 */
const getDynamicName = (endpoint, entityName, filterColumns = []) => {
    const map = { GET: "get", POST: "create", PUT: "modify", DELETE: "remove", fetch: "fetch", select: "select" };
    const prefix = map[endpoint] || endpoint;
    const entity = toPascalCase(entityName);

    if (!filterColumns || filterColumns.length === 0) return `${prefix}${entity}`;

    const filters = filterColumns
        .map(c => toPascalCase(c.includes('.') ? c.split('.')[1] : c))
        .join("And");

    return `${prefix}${entity}By${filters}`;
};

/**
 * Automatically registers the new controller in src/app/routes.ts with dynamic params
 */
async function importControllerAsARoute(projectRootPath, endpoint, entityName, filterColumns = []) {
    const routesPath = path.join(projectRootPath, "src", "app", "routes.ts");
    if (!fs.existsSync(routesPath)) return;

    let content = fs.readFileSync(routesPath, "utf8");
    const folderName = getDynamicName(endpoint.toLowerCase(), entityName, filterColumns);
    const controllerName = folderName;
    const importPath = `./controllers/${camelCase(entityName)}/${folderName}`;

    // 1. Inject Import Statement
    const importLine = `import ${controllerName} from "${importPath}";\n`;
    if (!content.includes(controllerName)) {
        const lines = content.split("\n");
        const lastImportIndex = lines.findLastIndex(line => line.trim().startsWith("import"));
        const insertAt = lastImportIndex === -1 ? 0 : lastImportIndex + 1;
        lines.splice(insertAt, 0, importLine);
        content = lines.join("\n");
    }

    // 2. Build Route Path (e.g. /users or /users/:userId)
    let routePath = `/${camelCase(entityName)}`;
    if (filterColumns && filterColumns.length > 0) {
        filterColumns.forEach(col => {
            const colName = col.includes('.') ? col.split('.')[1] : col;
            routePath += `/:${camelCase(colName)}`;
        });
    }

    // 3. Inject Router Definition
    const routeDefinition = `router.${endpoint.toLowerCase()}("${routePath}", ${controllerName});\n`;
    if (!content.includes(routeDefinition)) {
        if (content.includes("export default router;")) {
            content = content.replace("export default router;", `${routeDefinition}export default router;`);
        } else {
            content += `\n${routeDefinition}`;
        }
    }

    fs.writeFileSync(routesPath, content);
    await prettifyFile(routesPath);
}

module.exports = {
    name: "endpoint",
    userPrompt: async () => {
        schema = getSchema();
        if (!schema) return;

        const { addField, addArrayField, getAnswers } = useForm();

        addField(() => ({
            type: "list",
            name: "endpointTypes",
            message: "What type of endpoint will this be?",
            choices: Object.values(ENDPOINT_TYPES).slice(0, -1),
        }));

        addArrayField((values) => {
            values.endpointTypes = Array.isArray(values.endpointTypes) ? values.endpointTypes : [values.endpointTypes];
            const tablesToSelect = Object.keys(schema).map((table) => ({ name: table, value: table }));
            return {
                type: "list",
                name: "entityName",
                message: "What will be the main entity for this endpoint?",
                choices: tablesToSelect,
            };
        });

        addField((values) => {
            if (values.endpointTypes.includes("GET")) {
                return {
                    type: "list",
                    name: "isPaginated",
                    message: "Should GET endpoint be paginated?",
                    choices: ["Yes", "No"],
                };
            }
            values.isPaginated = "No";
        });

        addField((values) => {
            const columns = flatten([values.entityName].map(t => schema[t]));
            const defaultColumns = columns.filter(c => c.columnKey === "PRI").map(c => `${c.table}.${c.column}`);
            return ColumnSelector({
                columns,
                default: [],
                message: "Select columns to filter (Leave empty for no filters/Get All)",
                name: "filterColumns",
            });
        });

        addField((values) => {
            const columns = flatten([values.entityName].map(t => schema[t])).filter(c => c.columnKey !== "PRI");
            return ColumnSelector({
                columns,
                default: columns.map(c => `${c.table}.${c.column}`),
                message: "Select columns for include/response",
                name: "includeColumns",
            });
        });

        return await getAnswers();
    },
    files: [
        {
            source: "actions",
            targetFileNameMapper: async ({ projectRootPath, userVariables }) => {
                const { endpointTypes, entityName, filterColumns } = userVariables;
                return endpointTypes.map((endpoint) => {
                    const actionMap = { GET: "fetch", POST: "create", PUT: "modify", DELETE: "remove" };
                    const folderName = getDynamicName(actionMap[endpoint], entityName, filterColumns);
                    return {
                        path: path.join(projectRootPath, "src", "actions", camelCase(entityName), folderName, "index.ts"),
                        templatePath: path.join(__dirname, "template", "actions", `${actionMap[endpoint]}.liquid`),
                    };
                });
            },
            targetFileWriter: async ({ userVariables, targetFilePath }) => {
                const { endpointTypes, filterColumns, entityName } = userVariables;
                const flatPaths = targetFilePath.flat();
                return Promise.all(endpointTypes.map(async (endpoint, index) => {
                    const filePath = flatPaths[index];
                    if (!filePath || !filePath.templatePath) return;

                    const columns = flatten(schema[entityName]);
                    const mappedFilters = filterColumns.map(c => {
                        const col = columns.find(col => `${col.table}.${col.column}` === c || col.column === c);
                        return { ...col, camelName: camelCase(col.column), pascalName: toPascalCase(col.column) };
                    });

                    const renderedTemplate = await render(fs.readFileSync(filePath.templatePath, "utf-8"), {
                        ...userVariables,
                        filteredColumns: filterColumns,
                        mappedFilters
                    });
                    await writeFile(filePath.path, renderedTemplate);
                    await prettifyFile(filePath.path);
                }));
            }
        },
        {
            source: "controllers",
            targetFileNameMapper: async ({ projectRootPath, userVariables }) => {
                const { endpointTypes, entityName, filterColumns } = userVariables;
                return endpointTypes.map((endpoint) => {
                    const folderName = getDynamicName(endpoint.toLowerCase(), entityName, filterColumns);
                    return {
                        path: path.join(projectRootPath, "src", "app", "controllers", camelCase(entityName), folderName, "index.ts"),
                        templatePath: path.join(__dirname, "template", "controllers", `${endpoint.toLowerCase()}.liquid`),
                        paginatedTemplatePath: path.join(__dirname, "template", "controllers", "paginatedGet.liquid"),
                    };
                });
            },
            targetFileWriter: async ({ userVariables, targetFilePath, projectRootPath }) => {
                const { endpointTypes, isPaginated, entityName, filterColumns } = userVariables;
                const flatPaths = targetFilePath.flat();
                return Promise.all(endpointTypes.map(async (endpoint, index) => {
                    const filePath = flatPaths[index];
                    if (!filePath) return;
                    const tPath = (endpoint === "GET" && isPaginated === "Yes") ? filePath.paginatedTemplatePath : filePath.templatePath;

                    const renderedTemplate = await render(fs.readFileSync(tPath, "utf-8"), {
                        ...userVariables,
                        filteredColumns: filterColumns
                    });
                    await writeFile(filePath.path, renderedTemplate);
                    await prettifyFile(filePath.path);
                    await importControllerAsARoute(projectRootPath, endpoint, entityName, filterColumns);
                }));
            }
        },
        {
            source: "queries",
            targetFileNameMapper: async ({ projectRootPath, userVariables }) => {
                const { endpointTypes, entityName, filterColumns } = userVariables;
                return endpointTypes.map((endpoint) => {
                    const actionMap = { GET: "fetch", POST: "create", PUT: "modify", DELETE: "remove" };
                    const queryMap = { GET: "select", POST: "insert", PUT: "update", DELETE: "delete" };

                    const actionFolder = getDynamicName(actionMap[endpoint], entityName, filterColumns);
                    const queryFile = getDynamicName(queryMap[endpoint], entityName, filterColumns);

                    return {
                        path: path.join(projectRootPath, "src", "actions", camelCase(entityName), actionFolder, "queries", `${queryFile}.ts`),
                        templatePath: path.join(__dirname, "template", "queries", `${queryMap[endpoint]}.liquid`),
                    };
                });
            },
            targetFileWriter: async ({ userVariables, targetFilePath }) => {
                const flatPaths = targetFilePath.flat();
                return Promise.all(userVariables.endpointTypes.map(async (endpoint, index) => {
                    const filePath = flatPaths[index];
                    if (!filePath) return;

                    const rendered = await render(fs.readFileSync(filePath.templatePath, "utf-8"), {
                        ...userVariables,
                        filteredColumns: userVariables.filterColumns,
                        selectableColumns: userVariables.includeColumns,
                        schema
                    });
                    await writeFile(filePath.path, rendered);
                    await prettifyFile(filePath.path);
                }));
            }
        },
        {
            source: "schemas",
            targetFileNameMapper: async ({ projectRootPath, userVariables }) => {
                const { endpointTypes, entityName, filterColumns } = userVariables;
                return endpointTypes.map((endpoint) => {
                    const folderName = getDynamicName(endpoint.toLowerCase(), entityName, filterColumns);
                    const map = { GET: "newGet", POST: "newCreate", PUT: "newModify", DELETE: "newRemove" };
                    const schemaFile = getDynamicName(map[endpoint], entityName, filterColumns);

                    return {
                        path: path.join(projectRootPath, "src", "app", "controllers", camelCase(entityName), folderName, "schema", `${schemaFile}Schema.ts`),
                        templatePath: path.join(__dirname, "template", "schemas", "schema.liquid"),
                    };
                });
            },
            targetFileWriter: async ({ userVariables, targetFilePath }) => {
                const flatPaths = targetFilePath.flat();
                return Promise.all(userVariables.endpointTypes.map(async (endpoint, index) => {
                    const filePath = flatPaths[index];
                    if (!filePath) return;
                    const rendered = await render(fs.readFileSync(filePath.templatePath, "utf-8"), {
                        ...userVariables,
                        columns: flatten(schema[userVariables.entityName]),
                        filteredColumns: userVariables.filterColumns
                    });
                    await writeFile(filePath.path, rendered);
                    await prettifyFile(filePath.path);
                }));
            }
        }
    ],
    postGeneration: async () => {
        console.log(chalk.green`Fast Right? Now Have Fun!`);
    }
};