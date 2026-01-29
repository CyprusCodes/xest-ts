import mysql, { Connection, ConnectionOptions, QueryOptions } from "mysql2";
import { promisify } from "es6-promisify";
import path from "path";
import get from "lodash/get";
import camelCase from "lodash/camelCase";
import mapKeys from "lodash/mapKeys";
import monitoring from "~root/utils/monitoring";
import parseMySQLConnectionString from "~root/utils/parseMySQLConnectionString";
import nestTabularData from "~root/utils/nestTabularData";
import dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, ".env")
});

// --- Interfaces & Types ---
interface EscapedString extends String {
  _escaped_before?: symbol;
}

type PromisifiedFunction<T = any> = (...args: any[]) => Promise<T>;

const ESCAPE_SYMBOL = Symbol("ESCAPED");

// --- Database Configuration ---
const connectionDetails = process.env.DATABASE_URL
  ? parseMySQLConnectionString(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 3306
    };

const CONFIG: ConnectionOptions = {
  ...connectionDetails,
  timezone: "utc",
  charset: "utf8mb4",
  typeCast: (field: any, next: () => void) => {
    if (["DATETIME", "DATE", "TIMESTAMP"].includes(field.type)) {
      return field.string();
    }
    return next();
  },
  multipleStatements: true
};

// --- State Management ---
let connection: Connection = mysql.createConnection(CONFIG);

let promisifiedQueryFunction: PromisifiedFunction;
let promisifiedStartTransaction: PromisifiedFunction<void>;
let promisifedCommitTransaction: PromisifiedFunction<void>;
let promisifiedRollbackTransaction: PromisifiedFunction<void>;

let transactionStack: Error[] = [];
let queryLog: string[] = [];

// --- Exported Helper Methods (Placeholder Definitions) ---
export let sql: (strings: TemplateStringsArray, ...rest: any[]) => string;
export let sqlId: (identifier: string) => string;
export let sqlValueOrNull: (val: any) => string;
export let submitQuery: (
  strings: TemplateStringsArray,
  ...rest: any[]
) => Promise<any>;
export let startTransaction: () => Promise<void>;
export let commitTransaction: () => Promise<void>;
export let rollbackTransaction: () => Promise<void>;
export let disconnect: () => Promise<void>;

export const _getTransactionStack = () => transactionStack;
export const _getQueryLog = () => queryLog;
export const _resetTestQueryLog = () => {
  queryLog = [];
};

// --- Connection Initialization ---
const initConnection = (newConnection: Connection) => {
  transactionStack = [];

  // Use 'as any' to bridge the gap between mysql2's overloaded signatures and promisify
  promisifiedQueryFunction = promisify(
    newConnection.query.bind(newConnection)
  ) as any;
  promisifiedStartTransaction = promisify(
    newConnection.beginTransaction.bind(newConnection)
  ) as any;
  promisifedCommitTransaction = promisify(
    newConnection.commit.bind(newConnection)
  ) as any;
  promisifiedRollbackTransaction = promisify(
    newConnection.rollback.bind(newConnection)
  ) as any;

  startTransaction = async () => {
    const traceLabel = `${new Date()}: Uncommitted Transaction @`;
    const stack = new Error(traceLabel);

    if (transactionStack.length === 0) {
      await promisifiedStartTransaction();
    }
    transactionStack.push(stack);
  };

  commitTransaction = async () => {
    transactionStack.pop();
    if (transactionStack.length === 0) {
      return promisifedCommitTransaction();
    }
  };

  rollbackTransaction = async () => {
    transactionStack = [];
    return promisifiedRollbackTransaction();
  };

  sql = (strings: TemplateStringsArray, ...rest: any[]): string => {
    let escapedQuery = "";
    strings.forEach((string, i) => {
      const paramToEscape = rest[i];
      if (paramToEscape !== undefined) {
        const isEscaped =
          (paramToEscape as EscapedString)?._escaped_before === ESCAPE_SYMBOL;
        escapedQuery +=
          string +
          (isEscaped ? paramToEscape : newConnection.escape(paramToEscape));
      } else {
        escapedQuery += string;
      }
    });

    const query = new String(escapedQuery) as EscapedString;
    query._escaped_before = ESCAPE_SYMBOL;
    return (query as unknown) as string;
  };

  sqlId = (identifier: string): string => {
    const escapedId = new String(
      newConnection.escapeId(identifier)
    ) as EscapedString;
    escapedId._escaped_before = ESCAPE_SYMBOL;
    return (escapedId as unknown) as string;
  };

  sqlValueOrNull = (val: any) =>
    val === undefined || val === null ? sql`NULL` : sql`${val}`;

  submitQuery = async (strings: TemplateStringsArray, ...rest: any[]) => {
    const escapedQuery = sql(strings, ...rest).toString();
    if (strings[0].toLowerCase().includes("debug")) {
      console.log(`\x1B[36m${escapedQuery}\x1B[39m`);
    }
    if (process.env.NODE_ENV === "test") {
      queryLog.push(escapedQuery);
    }
    return promisifiedQueryFunction(escapedQuery);
  };

  disconnect = async () => {
    newConnection.end();
  };
};

// --- Connection Resilience ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MAX_CONN_RETRIES = 10;
const RETRY_DELAY = 1000;
let connectionRetries = 10;

function handleDisconnect(client: Connection) {
  client.on("error", async (error: any) => {
    if (!error.fatal) return;

    if (error.code !== "PROTOCOL_CONNECTION_LOST") {
      monitoring.error(error);
    }

    const currentRetryCount = MAX_CONN_RETRIES - connectionRetries + 1;
    await sleep(RETRY_DELAY * currentRetryCount);

    if (currentRetryCount > 1) {
      monitoring.info(
        `> ${currentRetryCount} - Re-connecting lost MySQL connection.`
      );
    }

    connection = mysql.createConnection(CONFIG);
    connection.connect(err => {
      if (err) {
        connectionRetries -= 1;
        if (connectionRetries < 1) {
          monitoring.error(
            `MySQL reconnection failed after ${MAX_CONN_RETRIES} retries.`
          );
          process.exit(1);
        }
      } else {
        connectionRetries = MAX_CONN_RETRIES;
        initConnection(connection);
        handleDisconnect(connection);
      }
    });
  });
}

// --- Query Wrapper Utilities ---
export const camelKeys = (query: (...args: any[]) => Promise<any[]>) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    return results.map(d => mapKeys(d, (v, k) => camelCase(k)));
  };
};

export const getFirst = (
  query: (...args: any[]) => Promise<any[]>,
  propertyToGet: string | null = null,
  defaultValue: any = null
) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    const pathToGet = propertyToGet ? `[0].${propertyToGet}` : "[0]";
    return get(results, pathToGet, defaultValue);
  };
};

export const getProperty = (
  query: (...args: any[]) => Promise<any[]>,
  propertyToGet: string,
  defaultValue: any = null
) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    return results.map(result => get(result, propertyToGet, defaultValue));
  };
};

export const getInsertIds = (query: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    const noIds = results.affectedRows - results.changedRows;
    const firstInsertId = results.insertId;
    return Array.from({ length: noIds }, (_, i) => firstInsertId + i);
  };
};

export const getInsertId = (query: (...args: any[]) => Promise<any>) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    return results.insertId;
  };
};

export const nest = (
  query: (...args: any[]) => Promise<any[]>,
  nestOptions: any
) => {
  return async (...args: any[]) => {
    const results = await query(...args);
    return nestTabularData(results, nestOptions);
  };
};

export const sqlReduce = (accumulator: string, currentValue: string) =>
  sql`${accumulator}, ${currentValue}`;

export const sqlReduceWithUnion = (
  accumulatedQuery: string,
  currentQuery: string
) => sql`
  ${accumulatedQuery}
  UNION ALL
  ${currentQuery}
`;

// --- Initialization ---
handleDisconnect(connection);
initConnection(connection);
