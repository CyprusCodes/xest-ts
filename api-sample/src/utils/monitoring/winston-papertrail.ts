/* eslint-disable max-classes-per-file */
// adapted from v2 branch
/* only change is the log method so it's aware of custom formatter Symbol.for('message')
 */
// https://github.com/kenperkins/winston-papertrail
/* eslint-disable no-plusplus */
/* eslint-disable no-underscore-dangle */
/**
 * winston-papertrail.js
 *
 * Transport for logging to Papertrail service
 * https://papertrailapp.com/
 *
 * Based on a previous version (1.x) by Ken Perkins.
 */

import Transport from "winston-transport";
import { Produce } from "glossy";
import net from "net";
import os from "os";
import tls from "tls";
import util from "util";
import errors from "request-promise/errors";
import { EventEmitter } from "events";
import pickBy from "lodash/pickBy";
import cloneDeep from "lodash/cloneDeep";
import get from "lodash/get";
import { getLoggingStatus } from "./monitoringStatus";

const syslogProducer = Produce;

const KEEPALIVE_INTERVAL = 15 * 1000;
const ERROR_KEYS_TO_KEEP = [
  "name",
  "cause",
  "statusCode",
  "message",
  "error",
  "options",
  "level",
  "meta",
  "response"
];
const RESPONSE_KEYS_TO_KEEP = ["headers", "body"];

interface PrunedError {
  meta: Record<string, any>;
  message: any;
  level: any;
}

const pruneRequestPromiseStatusCodeErrors = (rawError: any): PrunedError => {
  const result = {} as PrunedError;
  const meta = pickBy(rawError, (v, key) => {
    return ERROR_KEYS_TO_KEEP.includes(key);
  });
  result.meta = meta;

  const response = pickBy(get(rawError, "response", {}), (v, key) => {
    return RESPONSE_KEYS_TO_KEEP.includes(key);
  });
  meta.response = response;

  result.message = cloneDeep(meta.message);
  delete meta.message;

  result.level = cloneDeep(meta.level);
  delete meta.level;

  return result;
};

interface PapertrailConnectionOptions {
  host?: string;
  port?: number;
  attemptsBeforeDecay?: number;
  connectionDelay?: number;
  maxDelayBetweenConnections?: number;
  maximumAttempts?: number;
  disableTls?: boolean;
  flushOnClose?: boolean;
}

interface DeferredQueueItem {
  buffer: string;
  callback: () => void;
}

class PapertrailConnection extends EventEmitter {
  options: PapertrailConnectionOptions;

  connectionDelay: number;

  currentRetries: number;

  totalRetries: number;

  loggingEnabled: boolean;

  _shutdown: boolean;

  deferredQueue: DeferredQueueItem[];

  deferredQueueLength: number;

  stream!: net.Socket | tls.TLSSocket | null;

  socket!: net.Socket | null;

  _erroring!: boolean;

  attemptsBeforeDecay?: number;

  constructor(options: PapertrailConnectionOptions) {
    super();

    const DEFAULT_OPTIONS: PapertrailConnectionOptions = {
      attemptsBeforeDecay: 5,
      connectionDelay: 1000,
      maxDelayBetweenConnections: 60000,
      maximumAttempts: 25,
      disableTls: false,
      flushOnClose: true
    };

    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (!this.options.host || !this.options.port) {
      throw new Error("Missing required parameters: host and port");
    }

    this.connectionDelay = this.options.connectionDelay as number;
    this.currentRetries = 0;
    this.totalRetries = 0;
    this.loggingEnabled = true;
    this._shutdown = false;

    /**
     * Dev could instantiate a new logger and then call logger.log immediately.
     * We need a way to put incoming strings (from multiple transports) into
     * a buffer queue.
     */
    this.deferredQueue = [];
    this.deferredQueueLength = 0;

    this.connect();
  }

  connect(): void {
    if (this._shutdown || this._erroring) {
      return;
    }

    this.close();

    try {
      if (this.options.disableTls) {
        this.stream = net.createConnection(
          this.options.port as number,
          this.options.host as string,
          this.onConnected.bind(this)
        );
        this.stream.setKeepAlive(true, KEEPALIVE_INTERVAL);
        this.stream.once("error", this.onErrored.bind(this));
        this.stream.once("end", this.connect.bind(this));
      } else {
        this.socket = net.createConnection(
          this.options.port as number,
          this.options.host as string,
          () => {
            this.socket!.setKeepAlive(true, KEEPALIVE_INTERVAL);

            this.stream = tls.connect(
              {
                socket: this.socket!,
                rejectUnauthorized: false
              },
              this.onConnected.bind(this)
            );

            this.stream.once("error", this.onErrored.bind(this));
            this.stream.once("end", this.connect.bind(this));
          }
        );

        this.socket.once("error", this.onErrored.bind(this));
      }
    } catch (err) {
      this.onErrored(err);
    }
  }

  write(text: string, callback: () => void): void {
    // If the stream is writable
    if (this.stream && this.stream.writable) {
      this.stream.write(text, callback);
    } else {
      // Otherwise, store it in a buffer and write it when we're connected
      this.deferredQueue.push({
        buffer: text,
        callback
      });
      this.deferredQueueLength++;
    }
  }

  processBuffer(): void {
    if (
      this.deferredQueue.length === 0 ||
      !this.stream ||
      !this.stream.writable
    ) {
      return;
    }

    while (this.deferredQueue.length > 0) {
      const queueItem = this.deferredQueue.shift()!;

      const callback = () => {
        queueItem.callback();
        this.deferredQueueLength--;

        if (this.deferredQueueLength === 0) {
          this.stream!.emit("empty");
        }
      };

      this.stream.write(queueItem.buffer, callback);
    }
  }

  onConnected(): void {
    this.loggingEnabled = true;
    this.currentRetries = 0;
    this.totalRetries = 0;
    this.connectionDelay = this.options.connectionDelay as number;

    this.processBuffer();

    this.emit(
      "connect",
      `Connected to Papertrail at ${this.options.host}:${this.options.port}`
    );
  }

  onErrored(err: any): void {
    this._erroring = true;

    this.emitSilentError(err);

    setTimeout(() => {
      if (
        this.connectionDelay <
          (this.options.maxDelayBetweenConnections as number) &&
        this.currentRetries >= (this.attemptsBeforeDecay as number)
      ) {
        this.connectionDelay *= 2;
        this.currentRetries = 0;
      }

      if (
        this.loggingEnabled &&
        this.totalRetries >= (this.options.maximumAttempts as number)
      ) {
        this.loggingEnabled = false;
        this.emitSilentError(
          new Error("Max entries eclipsed, disabling buffering")
        );
      }

      this._erroring = false;
      this.connect();
    }, this.connectionDelay);
  }

  emitSilentError(err: any): void {
    if (this.listenerCount("error") > 0) {
      this.emit("error", err);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Papertrail connection error: ${err}`);
    }
  }

  clean(): void {
    try {
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }

      this.stream!.removeListener("end", this.connect);
      this.stream!.removeListener("error", this.onErrored);

      this.stream!.destroy();
      this.stream = null;
      // eslint-disable-next-line no-empty
    } catch (ignored) {}
  }

  close(): void {
    this._shutdown = true;

    if (this.stream) {
      if (this.options.flushOnClose && this.deferredQueueLength > 0) {
        this.stream.on("empty", () => {
          this.clean();
        });
      } else {
        this.clean();
      }
    }

    this._shutdown = false;
  }
}

interface PapertrailTransportOptions {
  level?: string;
  inlineMeta?: boolean;
  colorize?: boolean;
  program?: string;
  facility?: string;
  hostname?: string;
  depth?: number | null;
  levels?: Record<string, number | string>;
  logFormat?: (level: string, message: string) => string;
}

class PapertrailTransport extends Transport {
  connection: PapertrailConnection;

  options: PapertrailTransportOptions;

  producer: Produce;

  /**
   * @param {PapertrailConnection} connection
   * @param options
   */
  constructor(
    connection: PapertrailConnection,
    options: PapertrailTransportOptions = {}
  ) {
    super(options);

    const DEFAULT_OPTIONS: PapertrailTransportOptions = {
      inlineMeta: false,
      colorize: false,
      program: "default",
      facility: "daemon",
      hostname: os.hostname(),
      depth: null,
      levels: {
        silly: 7,
        debug: 7,
        verbose: 7,
        info: 6,
        warn: 4,
        error: 3
      },
      logFormat(level: string, message: string) {
        return `${level} ${message}`;
      }
    };

    this.connection = connection;

    this.options = { ...DEFAULT_OPTIONS, ...options };
    // eslint-disable-next-line new-cap
    this.producer = new syslogProducer({ facility: this.options.facility });
  }

  log(info: any, callback: () => void): void {
    if (!getLoggingStatus()) {
      callback();
      return;
    }
    if (info instanceof errors.StatusCodeError) {
      // eslint-disable-next-line no-param-reassign
      info = pruneRequestPromiseStatusCodeErrors(info);
    }

    setImmediate(() => {
      this.emit("logged", info);
    });

    // write to Papertrail
    const { level, message, meta } = info;
    let output = message;

    if (info[Symbol.for("message")]) {
      output = info[Symbol.for("message")];
    } else if (meta) {
      if (typeof meta !== "object") {
        output += ` ${meta}`;
      } else if (meta) {
        if (this.options.inlineMeta) {
          output += ` ${util
            .inspect(meta, {
              showHidden: false,
              depth: this.options.depth,
              colors: this.options.colorize
            })
            .replace(/[\n\t]\s*/gm, " ")}`;
        } else {
          output += `\n${util.inspect(
            meta,
            false,
            this.options.depth,
            this.options.colorize
          )}`;
        }
      }
    }

    this.sendMessage(level, output, callback);
  }

  sendMessage(level: string, message: string, callback: () => void): void {
    let lines: string[] = [];
    let msg = "";
    let gap = "";

    // Only split if we actually have a message
    if (message) {
      lines = message.split("\n");
    } else {
      lines = [""];
    }

    // If the incoming message has multiple lines, break them and format each
    // line as its own message
    for (let i = 0; i < lines.length; i++) {
      // don't send extra message if our message ends with a newline
      if (lines[i].length === 0 && i === lines.length - 1) {
        break;
      }

      if (i === 1) {
        gap = "    ";
      }

      // Strip escape characters (for colorization)
      // eslint-disable-next-line no-control-regex
      const cleanedLevel = level.replace(/\u001b\[\d+m/g, "");
      msg += `${this.producer.produce({
        severity: this.options.levels![cleanedLevel] || cleanedLevel,
        host: this.options.hostname,
        appName: this.options.program,
        date: new Date(),
        message: this.options.logFormat!(level, gap + lines[i])
      })}\r\n`;
    }

    this.connection.write(msg, callback);
  }

  close(): void {
    this.connection.close();
  }
}

export { PapertrailConnection, PapertrailTransport };
