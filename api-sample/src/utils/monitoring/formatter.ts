import winston from "winston";
import yamlifyObject from "yamlify-object";

const utils = require("winston-console-formatter/dist/utils");
const Message = require("winston-console-formatter/dist/message");
const Colorizer = require("winston-console-formatter/dist/colorizer");
const defaultErrorColors = require("winston-console-formatter/dist/colors");
const yamlifyColors = require("yamlify-object-colors");

const MESSAGE = Symbol.for("message");

// 1. Expanded interface to include missing properties
interface FormatterOptions {
  prefix?: string;
  postfix?: string;
  stackTrace?: boolean;
  colors?: any;
  types?: any;
  timestamp?: string;
  label?: string;
  level?: string; // Added this to fix the ts(2339) error
}

const getInfoMessagePlainText = (
  infoMessage: any,
  options: FormatterOptions
): string => {
  if (typeof infoMessage === "object") {
    return yamlifyObject(infoMessage, {
      colors: options.types,
      indent: "  ",
      prefix: "\n",
      postfix: ""
    });
  }
  return infoMessage;
};

/**
 * Custom Winston format.
 * We cast the function to 'any' or 'winston.Logform.Format' to resolve the
 * compatibility issue with the 'TransformFunction' type.
 */
const customFormat = winston.format((info: any, opts: any = {}) => {
  // 2. Cast opts to FormatterOptions after receiving it
  const options = {
    prefix: "",
    postfix: "",
    stackTrace: true,
    colors: defaultErrorColors,
    types: yamlifyColors,
    ...(opts as FormatterOptions)
  };

  const remainingInfo = { ...info };
  delete remainingInfo.from;
  delete remainingInfo.stack;
  delete remainingInfo.trace;
  delete remainingInfo.message;
  delete remainingInfo.timestamp;
  delete remainingInfo.label;
  delete remainingInfo.level;

  const stackTraceRaw = info.stack || info.trace;
  let stackTraceJoined: string | undefined;
  let stackTraceMessage: string | undefined;

  if (!info.message && Array.isArray(stackTraceRaw)) {
    stackTraceMessage = stackTraceRaw[0];
  }

  if (Array.isArray(stackTraceRaw)) {
    stackTraceJoined = stackTraceRaw.join("\n");
  }

  let formattedMessage = new Message()
    .setColorizer(new Colorizer(info.colors || options.colors))
    .setTime(info.timestamp || options.timestamp)
    .setLabel(info.label || options.label)
    .setLevel(info.level || options.level) // No longer throws error
    .setFrom(info.from)
    .setMessage(
      stackTraceMessage || getInfoMessagePlainText(info.message, options)
    )
    .toString();

  if (options.stackTrace) {
    formattedMessage += utils.getStackTrace(
      stackTraceJoined === undefined ? stackTraceRaw : stackTraceJoined,
      Boolean(options.colors)
    );
  }

  const metaData = yamlifyObject(remainingInfo, {
    colors: options.types,
    indent: "  ",
    prefix: "\n",
    postfix: ""
  });

  if (metaData && metaData !== "\n") {
    formattedMessage += metaData;
  }

  // Use the Symbol for the final message
  info[
    (MESSAGE as unknown) as string
  ] = `${options.prefix}${formattedMessage}${options.postfix}`;

  return info;
});

export default customFormat;
