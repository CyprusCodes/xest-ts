import {
  camelCase,
  kebabCase,
  lowerCase,
  snakeCase,
  startCase,
  upperCase,
  upperFirst,
  uniq,
  get,
} from "lodash";
import { singular, plural } from "pluralize";
import { Liquid } from "liquidjs";
import toPascalCase from "../../toPascalCase";

declare const str: string;

const enrichEngine = (engine: Liquid): void => {
  engine.registerFilter("toCamelCase", (v: string) => camelCase(v));
  engine.registerFilter("toTitleCase", (v: string) => startCase(camelCase(v)));
  engine.registerFilter("toPascalCase", (v: string) =>
    startCase(camelCase(v)).replace(/ /g, "")
  );
  engine.registerFilter("toConstantCase", (v: string) =>
    upperCase(v).replace(/ /g, "_")
  );
  engine.registerFilter("toTypeScriptType", (v: string) => {
    switch (v) {
      case "int":
        return "number";
      case "varchar":
        return "string";
      case "datetime":
        return "Date";
      case "tinyint":
        return "boolean";
      default:
        return "any";
    }
  });
  engine.registerFilter("toDotCase", (v: string) =>
    lowerCase(v).replace(/ /g, ".")
  );
  engine.registerFilter("toKebabCase", (v: string) => kebabCase(v));
  engine.registerFilter("toLowerCase", (v: string) =>
    lowerCase(v).replace(/ /g, "")
  );
  engine.registerFilter("toPathCase", (v: string) =>
    lowerCase(v).replace(/ /g, "/")
  );
  engine.registerFilter("toSnakeCase", (v: string) => snakeCase(v));
  engine.registerFilter("toSentenceCase", (v: string) =>
    upperFirst(lowerCase(str))
  );
  engine.registerFilter("singular", (v: string) => singular(v));
  engine.registerFilter("plural", (v: string) => plural(v));
  engine.registerFilter("varcharSize", (v: string) => {
    const size = v.split("(")[1].split(")")[0];
    return size;
  });
  engine.registerFilter("schemaImports", (v: any[]) => {
    let imports: string[] = [];
    const filteredSchema = v.filter(
      (c: any) =>
        (c.columnKey === "MUL" || c.columnKey === "PRI") && c.dataType === "int"
    );
    const uniqueTargetTables = [
      ...new Set(filteredSchema.map((c: any) => c.foreignKeyTo.targetTable)),
    ];
    Promise.all(
      uniqueTargetTables.map(async (table: string) => {
        imports.push(
          `const select${toPascalCase(
            table
          )}ById = require('./queries/select${toPascalCase(table)}ById');`
        );
      })
    );

    return imports.join("\n");
  });
  engine.registerFilter("functionParameters", (args: string[]) => {
    // assume we are passing an object parameter {}
    if (!args.length) {
      return "";
    }

    const isUsingDotNotation = args.find((field: string) =>
      field.includes(".")
    );
    if (isUsingDotNotation) {
      return `{ ${args
        .map((v: string) => camelCase(v.split(".")[1]))
        .join(",")} }`;
    }

    return `{ ${args.map((v: string) => camelCase(v)).join(",")} }`;
  });
  engine.registerFilter("sqlColumns", (fields: string[], schema: any) => {
    if (!fields.length) {
      return "";
    }

    // check if columns with same name exist
    let fieldList: string[] = [];
    const isUsingDotNotation = fields.find((field: string) =>
      field.includes(".")
    );
    if (isUsingDotNotation) {
      const originalFields = fields.map((field: string) => {
        const fieldDetails = field.split(".");
        return {
          table: fieldDetails[0],
          column: fieldDetails[1],
        };
      });
      fieldList = originalFields
        .map((field: { table: string; column: string }): any => {
          // check for conflict
          const conflictingField = originalFields.find(
            (checkField: { table: string; column: string }) => {
              return (
                checkField.column === field.column &&
                checkField.table !== field.table
              );
            }
          );

          if (conflictingField) {
            const fieldDetails = schema[field.table].find(
              (c: any) => c.column === field.column
            );
            if (
              get(fieldDetails, "foreignKeyTo.targetTable") ===
              conflictingField.table
            ) {
              // this is just a FK to other field, so we can keep it
              return field;
            }
            const conflictingFieldDetails = schema[conflictingField.table].find(
              (c: any) => c.column === conflictingField.column
            );
            if (
              get(conflictingFieldDetails, "foreignKeyTo.targetTable") ===
              field.table
            ) {
              // this is the target of FK field, so we can skip it
              return null;
            }

            // this is a legitimate name conflict
            // and these fields are not associated with each other, so rename them
            return {
              table: field.table,
              column: `${field.table}_${field.column}`,
            };
          }
          return field;
        })
        .filter((v: any) => !!v)
        .map((field: any) => `${field.table}.${field.column}`);
    } else {
      fieldList = uniq(fields);
    }

    return `${fieldList.join(",")}`;
  });

  engine.registerFilter("sqlFilters", (fields: string[]) => {
    if (!fields.length) {
      return "";
    }
    let fieldList: string[] = uniq(fields);
    return `WHERE ${fieldList
      .map(
        (v: string) => `${v.split(".")[1]} = \${${camelCase(v.split(".")[1])}}`
      )
      .join(" AND ")}`;
  });

  engine.registerFilter("sqlVariables", (fields: string[]) => {
    if (!fields.length) {
      return "";
    }
    let fieldList: string[] = uniq(fields);
    const isUsingDotNotation = fields[0].includes(".");

    if (isUsingDotNotation) {
      return `${fieldList
        .map((v: string) => `\${${camelCase(v.split(".")[1])}\}`)
        .join(",")}`;
    }
    return `${fieldList.map((v: string) => `\${${camelCase(v)}\}`).join(",")}`;
  });

  engine.registerFilter("sqlUpdateParams", (fields: string[]) => {
    if (!fields.length) {
      return "";
    }

    let fieldList: string[] = uniq(fields);
    const isUsingDotNotation = fields.find((field: string) =>
      field.includes(".")
    );

    if (isUsingDotNotation) {
      return `${fieldList
        .map(
          (v: string) =>
            `${v.split(".")[1]} = \${${camelCase(v.split(".")[1])}}`
        )
        .join(",")}`;
    }
    return `${fieldList
      .map((v: string) => `${v} = \${${camelCase(v)}\}`)
      .join(",")}`;
  });

  engine.registerFilter("joinGenerator", (tables: string[], schema: any) => {
    if (tables.length <= 1) {
      return ``;
    }
    const joinedSoFar = [tables[0]]; // first table is used by the FROM
    const joinSQL = (
      sourceTable: string,
      targetTable: string,
      sourceColumn: string,
      targetColumn: string
    ): string =>
      `LEFT JOIN ${targetTable} ON ${sourceTable}.${sourceColumn} = ${targetTable}.${targetColumn}`;
    let joins = ``;
    const tablesToJoin = tables.slice(1);
    tablesToJoin.forEach((targetTable: string) => {
      joinedSoFar.forEach((joinedTable: string) => {
        const targetColumn = schema[joinedTable].find(
          (column: any) =>
            get(column, "foreignKeyTo.targetTable") === targetTable
        );
        if (targetColumn) {
          joins =
            joins +
            joinSQL(
              joinedTable,
              targetColumn.foreignKeyTo.targetTable,
              targetColumn.column,
              targetColumn.foreignKeyTo.targetColumn
            );
          joinedSoFar.push(targetColumn.foreignKeyTo.targetTable);
        }
      });
    });
    return joins;
  });
  engine.registerFilter(
    "paginatedJoinGenerator",
    (tables: string[], schema: any) => {
      if (tables.length <= 1) {
        return ``;
      }
      const joinedSoFar = [tables[0]]; // first table is used by the FROM
      const joinSQL = (
        sourceTable: string,
        targetTable: string,
        sourceColumn: string,
        targetColumn: string
      ): string =>
        `LEFT JOIN ${targetTable} ON ${sourceTable}.${sourceColumn} = ${targetTable}.${targetColumn}`;
      let joins: string[] = [];
      const tablesToJoin = tables.slice(1);
      tablesToJoin.forEach((targetTable: string) => {
        joinedSoFar.forEach((joinedTable: string) => {
          const targetColumn = schema[joinedTable].find(
            (column: any) =>
              get(column, "foreignKeyTo.targetTable") === targetTable
          );
          if (targetColumn) {
            const joinStatement = joinSQL(
              joinedTable,
              targetColumn.foreignKeyTo.targetTable,
              targetColumn.column,
              targetColumn.foreignKeyTo.targetColumn
            );
            joins.push(`sql\`${joinStatement}\``);
            joinedSoFar.push(targetColumn.foreignKeyTo.targetTable);
          }
        });
      });
      return joins.join(", ");
    }
  );
};

export default enrichEngine;
