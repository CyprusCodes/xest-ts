import "module-alias/register";
import helmet from "helmet";
import express, { Application, Request } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import monitoring from "~root/utils/monitoring";
import qs from "qs";

// Import side-effect for production check
import exitIfProductionDatabase from "~root/utils/exitIfProductionDatabase";
exitIfProductionDatabase();

import router from "./routes";

const port: string | number = process.env.PORT || 3001;
const app: Application = express();

// see https://expressjs.com/en/guide/behind-proxies.html
app.set("trust proxy", 1);

// Custom query parser configuration
app.set("query parser", (str: string) => {
  return qs.parse(str, {
    arrayLimit: 50,
    depth: 20,
    decoder: (queryString: string) => {
      return decodeURIComponent(queryString);
    }
  });
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(compression());
app.use(morgan("combined", { stream: monitoring.stream }));

if (process.env.APP_ENVIRONMENT === "PRODUCTION") {
  // 60 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60
  });
  app.use(limiter);
}

app.use(router);

// .info specifically expects a string, avoiding the LogEntry conflict
app.listen(port, () => monitoring.info(`API listening on port ${port}!`));

export default app;
