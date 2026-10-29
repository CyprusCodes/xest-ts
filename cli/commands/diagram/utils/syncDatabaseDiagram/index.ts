import fs from "fs-extra";
import path from "path";
import {
  getSchema,
  getForeignKeys,
  getPrimaryKey,
} from "../../../../utils/getSchema";
import flattenDeep from "lodash/flattenDeep";
import getPreviousColumnComment from "../getPreviousColumnComment";
import getPreviousTableComment from "../getPreviousTableComment";

export interface AzimuttOrigin {
  id: string;
  lines: unknown[];
}

export interface AzimuttColumn {
  name: string;
  type: string;
  nullable: boolean;
  comment?: string;
  origins: AzimuttOrigin[];
}

export interface AzimuttPrimaryKey {
  name: string;
  columns: string[];
  origins: AzimuttOrigin[];
}

export interface AzimuttTable {
  schema: string;
  table: string;
  columns: AzimuttColumn[];
  uniques: unknown[];
  primaryKey?: AzimuttPrimaryKey;
  comment?: string;
  origins: AzimuttOrigin[];
}

export interface AzimuttRelationEndpoint {
  table: string;
  column: string;
}

export interface AzimuttRelation {
  name: string;
  src: AzimuttRelationEndpoint;
  ref: AzimuttRelationEndpoint;
  origins: AzimuttOrigin[];
}

export interface AzimuttSource {
  tables: AzimuttTable[];
  relations: AzimuttRelation[];
}

export interface AzimuttDiagram {
  sources: Record<string, AzimuttSource>;
}

interface SchemaColumn {
  column: string;
  columnnType: string;
  nullable: boolean;
}

interface SchemaForeignKey {
  table: string;
  column: string;
  foreignKeyTo: {
    targetTable: string;
    targetColumn: string;
  };
}

interface SyncDatabaseDiagramOptions {
  rootPath: string;
}

const syncDatabaseDiagram = ({
  rootPath,
}: SyncDatabaseDiagramOptions): void => {
  const diagramFile = path.join(rootPath, "./db-diagram.json");
  const doesItExist = fs.pathExistsSync(diagramFile);
  let diagramJSON = {} as AzimuttDiagram;
  let previousDiagramJSON = {} as AzimuttDiagram;

  if (!doesItExist) {
    try {
      const sampleFile = fs.readFileSync(path.join(__dirname, "./sample.json"));
      diagramJSON = JSON.parse(sampleFile as unknown as string);
    } catch (error) {
      console.log("Can't find sample diagram JSON file.");
      return;
    }
  } else {
    try {
      const existingFile = fs.readFileSync(diagramFile);
      diagramJSON = JSON.parse(existingFile as unknown as string);
      previousDiagramJSON = diagramJSON;
    } catch (error) {
      (
        console.log(
          "Trouble reading db-diagram.json file. Is it malformed? Try deleting db-diagram.json and starting again"
        ) as unknown as { return?: unknown }
      ).return;
    }
  }

  const databaseSchema = getSchema() as unknown as Record<
    string,
    SchemaColumn[]
  >;
  const tables = Object.entries(databaseSchema).map(([tableName, columns]) => {
    let primaryKey = getPrimaryKey(tableName);
    let primarkKeyName = "";
    if (primaryKey) {
      primarkKeyName = primaryKey.column;
    }

    const tableComment = getPreviousTableComment(
      tableName,
      previousDiagramJSON
    );

    return {
      schema: "public",
      table: tableName,
      columns: columns.map((column) => {
        const columnComment = getPreviousColumnComment(
          tableName,
          column.column,
          previousDiagramJSON
        );

        return {
          name: column.column,
          type: column.columnnType,
          nullable: column.nullable,
          ...(columnComment
            ? {
                comment: columnComment,
              }
            : {}),
          origins: [
            {
              id: "98006620-7170-46c5-8740-3c9d395729a5",
              lines: [],
            },
          ],
        };
      }),
      uniques: [
        /** TODO: compute unique constraints */
      ],
      ...(primaryKey
        ? {
            primaryKey: {
              name: `${tableName}_pk`,
              columns: [primarkKeyName],
              origins: [
                {
                  id: "98006620-7170-46c5-8740-3c9d395729a5",
                  lines: [],
                },
              ],
            },
          }
        : {}),
      ...(tableComment
        ? {
            comment: tableComment,
          }
        : {}),
      origins: [
        {
          id: "98006620-7170-46c5-8740-3c9d395729a5",
          lines: [],
        },
      ],
    };
  });

  const tableNames = Object.keys(databaseSchema);
  const allForeignKeysDeep = tableNames
    .map((tableName) => getForeignKeys(tableName))
    .filter((fks) => fks.length > 0);
  const allForeignKeys = flattenDeep(
    allForeignKeysDeep
  ) as unknown as SchemaForeignKey[];

  const relations = allForeignKeys.map((foreignKey) => {
    return {
      name: `${foreignKey.table}_${foreignKey.column}_fk`,
      src: {
        table: `public.${foreignKey.table}`,
        column: foreignKey.column,
      },
      ref: {
        table: `public.${foreignKey.foreignKeyTo.targetTable}`,
        column: foreignKey.foreignKeyTo.targetColumn,
      },
      origins: [
        {
          id: "98006620-7170-46c5-8740-3c9d395729a5",
          lines: [],
        },
      ],
    };
  });

  diagramJSON.sources["0"] = {
    ...diagramJSON.sources["0"],
    tables,
    relations,
  };
  fs.writeFileSync("./db-diagram.json", JSON.stringify(diagramJSON, null, 2));

  // todo: drop unrecognized tables and columns from layouts (give visual summary of whats dropped)
  // todo: nice to haves on schemas: unique constraint, indexes, composite pk
};

export default syncDatabaseDiagram;
