import inquirer from "inquirer";
import flatten from "lodash/flatten";
import get from "lodash/get";
import uniqBy from "lodash/uniqBy";
import { format } from "sql-formatter";
import isEmpty from "lodash/isEmpty";
import orderBy from "lodash/orderBy";
import TableSelector from "../../components/TableSelector";
import useForm from "../../components/Form";
import Graph from "../../utils/Graph";
import { getSchema, getForeignKeys } from "../../utils/getSchema";
import chalk from "chalk";
import getFakerMethods from "./utils/fakerMethods";
import chooseDefaultSeedMethod from "./utils/chooseDefaultSeedMethod";
import { getFakerExample, getFakerValue } from "./utils/getFakerExample";
import leven from "fast-levenshtein";
import { quickScore } from "quick-score";
import { Recipe } from "../types";

const seedRecipe: Recipe<string> = {
  name: "seed", // MUST match directory name
  userPrompt: async (projectRootPath) => {
    const schema = getSchema();
    if (!schema) {
      return;
    }

    const { addField, addArrayField, getAnswers } = useForm();

    const { add } = addArrayField((values) => {
      const tablesSelected: string[] = values.table || [];
      const existingForeignKeys = flatten(
        tablesSelected.map((table) => getForeignKeys(table))
      );
      const currentlySelectableTables = existingForeignKeys.map(
        (x) => x.foreignKeyTo.targetTable
      );

      const tablesToSelect = Object.keys(schema)
        .map((table) => ({
          name: table,
          value: table,
        }))
        .filter((c) => !(values.table || []).includes(c.name))
        .filter((c) => {
          if ((values.table || []).length > 0) {
            return currentlySelectableTables.find((st) => st === c.name);
          }
          return true;
        });

      return TableSelector({
        tables: tablesToSelect,
        onReply: async (tableNameSelected) => {
          // get all foreign keys of all selected tables
          const newForeignKeys = getForeignKeys(tableNameSelected);
          const allForeignKeys = uniqBy(
            [...newForeignKeys, ...existingForeignKeys],
            (check) => `${check.table}.${check.column}`
          );
          const selectableTables = allForeignKeys.map(
            (x) => x.foreignKeyTo.targetTable
          );
          const areThereAnyOtherTablesToJoin = selectableTables.some(
            (table) => !tablesSelected.includes(table)
          );
          if (areThereAnyOtherTablesToJoin) {
            const hasSelectedTables = tablesSelected.length;
            console.log(
              `You will be seeding ${chalk.green`${
                hasSelectedTables ? tablesSelected.join(",") : tableNameSelected
              }`}`
            );

            const result = await inquirer.prompt({
              type: "confirm",
              name: "addMore",
              message: chalk.yellow`Would you like to seed another table?`,
              default: "y",
            });
            if (result.addMore) {
              add();
            }
          }
        },
      });
    });

    addField((values) => {
      return {
        type: "input",
        name: "seedCount",
        message: "How many seed records do you want to create?",
        default: 1,
      };
    });

    console.log(chalk.green`=== SEEDER EXAMPLES ===\n https://fakerjs.dev/\n`);

    addArrayField((values) => {
      const tablesSelected: string[] = values.table;
      const columns = flatten(tablesSelected.map((table) => schema[table]));

      const seedableColumns = columns
        .filter((c) => c.extra !== "auto_increment")
        .filter((c) => isEmpty(c.foreignKeyTo));
      const seedFunctions = getFakerMethods();

      seedableColumns.forEach((column) => {
        const defaultValue: any = chooseDefaultSeedMethod(column);
        const seederChoicesOrderedByRelevance = seedFunctions
          .map((s) => {
            return {
              ...s,
              quickScore: quickScore(s.path, column.column),
              levenDistance: leven.get(s.path, column.column),
            };
          })
          .sort((a, b) => {
            if (a.quickScore > 0 || b.quickScore > 0) {
              return b.quickScore - a.quickScore;
            }

            return a.levenDistance - b.levenDistance;
          })
          .map((s) => {
            return {
              name: `${s.path}, e.g: ${s.sampleOutput}`,
              value: s.path,
            };
          });

        addField(() => {
          return {
            type: "search-list",
            name: `${column.table}.${column.column}`,
            message: `Choose seed generator for column: ${column.table}.${column.column}`,
            choices: [
              {
                name: `${defaultValue} e.g: ${getFakerExample(defaultValue)}`,
                value: defaultValue,
              },
              ...seederChoicesOrderedByRelevance,
            ],
            default: defaultValue,
          };
        });
      });
    });

    const responses = await getAnswers();
    return responses;
  },
  files: [
    {
      source: "queries/insert.js",
      targetFileNameMapper: () => {
        return "path";
      },
      targetFileWriter: async ({
        sourceFilePath,
        targetFilePath,
        userVariables,
      }) => {
        const schema = getSchema();
        if (!schema) {
          return;
        }

        const { table: tables, seedCount } = userVariables;
        let graph = new Graph();
        tables.forEach((tableName: string) => {
          graph.addVertex(tableName);
        });

        tables.forEach((sourceTableName: string) => {
          const foreignKeys = getForeignKeys(sourceTableName);
          // we are only interested in the foreign keys
          // user has decided to populate automatically
          // rest will be left as TODO comments for the programmer
          foreignKeys.forEach((fk: any) => {
            const targetTable = fk.foreignKeyTo.targetTable;
            if (tables.includes(targetTable)) {
              graph.addEdge(sourceTableName, targetTable);
            }
          });
        });

        const tablesToPopulate = tables.map((name: string) => {
          return {
            name,
            inDegree: graph.getIndegree(name),
          };
        });

        const finalTableToPopulate = tablesToPopulate.find(
          (t: any) => t.inDegree === 0
        );
        const tablesToPopulateWithDepths = tablesToPopulate.map(
          (table: any) => {
            const pathExists = graph.doesPathExist(
              finalTableToPopulate!.name,
              table.name
            );
            return {
              ...table,
              depth: pathExists.pathExists ? pathExists.path.length - 1 : 0,
            };
          }
        );

        const insertedRecords: Record<string, string[]> = {};
        let insertSeedSQL = ``;
        const tablesToInsert = orderBy(
          tablesToPopulateWithDepths,
          ["depth"],
          ["desc"]
        );
        tablesToInsert.forEach((table) => {
          const { name } = table;
          const columns = schema[name];
          for (let i = 0; i < seedCount; i++) {
            const columnsToInsert = columns
              .map((column: any) => {
                const seederTemplate =
                  userVariables[`${column.table}.${column.column}`];
                const isItFK = !isEmpty(column.foreignKeyTo);
                const isAutoIncrement = column.extra === "auto_increment";
                if (isAutoIncrement) {
                  // this column will be filled automatically
                  return null;
                }

                let seed =
                  "NULL, -- todo: please fill above value, or drop this comment";
                if (isItFK) {
                  const targetTable = column.foreignKeyTo.targetTable;
                  // todo: might need lodash get here
                  // , if user decides to skip populating other tables on purpose
                  if (get(insertedRecords, `${targetTable}[${i}]`)) {
                    seed = `@${insertedRecords[targetTable][i]},`;
                  }
                }

                if (seederTemplate) {
                  let rawSeedValue = getFakerValue(seederTemplate);
                  if (isNaN(rawSeedValue)) {
                    seed = `"${rawSeedValue}",`;
                  } else {
                    seed = `${rawSeedValue},`;
                  }
                }
                return {
                  table: column.table,
                  column: column.column,
                  value: seed,
                };
              })
              .filter((v: any) => !!v);

            let sql = `\n\nINSERT INTO ${columnsToInsert[0].table}`;
            sql =
              sql + `(${columnsToInsert.map((v: any) => v.column).join(",")})`;

            let listOfColumns = columnsToInsert
              .map((v: any) => v.value)
              .join("\n");
            if (listOfColumns[listOfColumns.length - 1] === ",") {
              listOfColumns = listOfColumns.slice(0, -1);
            }

            sql = sql + `VALUES (${listOfColumns}\n);`;
            sql =
              sql +
              `\nSET @${columnsToInsert[0].table}_${i + 1} = LAST_INSERT_ID();`;
            insertSeedSQL = insertSeedSQL + sql;
            if (insertedRecords[columnsToInsert[0].table]) {
              insertedRecords[columnsToInsert[0].table].push(
                `${columnsToInsert[0].table}_${i + 1}`
              );
            } else {
              insertedRecords[columnsToInsert[0].table] = [
                `${columnsToInsert[0].table}_${i + 1}`,
              ];
            }
          }
        });

        console.log(chalk.green`\nSEED MIGRATIONS BELOW:\n`);
        const formattedSQL = format(insertSeedSQL);
        const finalSQL = formattedSQL
          .replace(/@ /g, "@")
          .replace(/SET\s\s+/g, "SET ")
          .replace(/\_ID\(\);/g, "_ID();\n");
        console.log(finalSQL);

        console.log(
          chalk.green`You can use MySQL Workbench to test your migration script. Once happy copy and paste it to the database/seed-data.sql file.`
        );
        return true;
      },
    },
  ],
};

export default seedRecipe;
