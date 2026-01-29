import winston from "winston";
import formatter from "./formatter";

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: "debug",
    handleExceptions: true,
    format: winston.format.combine(
      winston.format.json(),
      winston.format.colorize()
    )
  })
];

/**
 * We define the shape Morgan expects.
 * We don't 'extend' winston.Logger to avoid the naming collision on 'stream'.
 */
type MorganStream = {
  stream: {
    write: (message: string) => void;
  };
};

// Combine Winston's Logger with our custom stream shape using an intersection (&)
type LoggerWithStream = winston.Logger & MorganStream;

const logger = winston.createLogger({
  transports,
  exitOnError: false,
  exceptionHandlers: transports,
  format: formatter()
}) as LoggerWithStream; // Cast it here

(logger as any).stream = {
  write(message: string): void {
    if (process.env.NODE_ENV !== "test") {
      logger.info(message.trim());
    }
  }
};

const originalLog = logger.log.bind(logger);

// @ts-ignore
logger.log = function(level: any, msg?: any, ...args: any[]): winston.Logger {
  if (process.env.NODE_ENV === "test") {
    return logger;
  }

  if (arguments.length === 1) {
    return logger.info(level);
  }

  return originalLog(level, msg, ...args);
};

export default logger;
