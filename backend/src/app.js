import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import {
  env,
} from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import homeRoutes from "./routes/home.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import reportingPeriodsRoutes from "./routes/reportingPeriods.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import importsRoutes from "./routes/imports.routes.js";
import dataManagementRoutes from "./routes/dataManagement.routes.js";
import aiSatisfactionRoutes from "./routes/aiSatisfaction.routes.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins =
  String(
    env.FRONTEND_URL || ""
  )
    .split(",")
    .map((origin) =>
      origin.trim()
    )
    .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs:
      15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

if (
  env.NODE_ENV !== "test"
) {
  app.use(
    morgan("dev")
  );
}

app.get(
  "/",
  (request, response) => {
    response.json({
      success: true,
      message:
        "Angelbird Analytics API",
      version: "1.0.0",
    });
  }
);

app.use(
  "/api/health",
  healthRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/home",
  homeRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/reports",
  reportsRoutes
);

app.use(
  "/api/ai/satisfaction",
  aiSatisfactionRoutes
);

app.use(
  "/api/imports",
  importsRoutes
);

app.use(
  "/api/data-management",
  dataManagementRoutes
);

app.use(
  "/api/reporting-periods",
  reportingPeriodsRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;