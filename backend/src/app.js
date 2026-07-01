import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import homeRoutes from "./routes/home.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import importsRoutes from "./routes/imports.routes.js";
import dataManagementRoutes from "./routes/dataManagement.routes.js";
import reportingPeriodsRoutes from "./routes/reportingPeriods.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import aiSatisfactionRoutes from "./routes/aiSatisfaction.routes.js";

/*
 * Apne existing auth routes ya doosre routes hon
 * to un imports ko bhi yahan retain karna.
 */

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://reportangelbird.mahimediasolutions.com",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    ...String(process.env.FRONTEND_URL)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Requests without Origin include:
       * curl, Postman, server-to-server requests
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `CORS blocked request from origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "Accept",
    ],
  })
);

app.options("*", cors());

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
  process.env.NODE_ENV !== "test"
) {
  app.use(morgan("dev"));
}

/*
 * Root route
 */
app.get("/", (request, response) => {
  response.status(200).json({
    success: true,
    message: "Angelbird Analysis API is running.",
    environment:
      process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/*
 * Health endpoint
 */
app.get("/api/health", async (request, response) => {
  response.status(200).json({
    success: true,
    message: "Angelbird Analysis API is healthy.",
    environment:
      process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

/*
 * API routes
 */
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

app.use(
  "/api/ai/satisfaction",
  aiSatisfactionRoutes
);

/*
 * API 404
 */
app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

/*
 * Central error handler
 */
app.use(
  (
    error,
    request,
    response,
    next
  ) => {
    console.error("API Error:", {
      message: error.message,
      stack: error.stack,
      status:
        error.statusCode ||
        error.status ||
        500,
      method: request.method,
      path: request.originalUrl,
    });

    const statusCode =
      Number(
        error.statusCode ||
          error.status
      ) || 500;

    let message =
      error.message ||
      "Internal server error.";

    if (
      error?.status === 429 ||
      error?.code ===
        "insufficient_quota" ||
      error?.error?.code ===
        "insufficient_quota"
    ) {
      message =
        "AI analysis is unavailable because the OpenAI API project has no available quota.";

      return response.status(503).json({
        success: false,
        message,
        code: "AI_QUOTA_UNAVAILABLE",
      });
    }

    response.status(statusCode).json({
      success: false,
      message,

      ...(process.env.NODE_ENV !==
      "production"
        ? {
            stack: error.stack,
          }
        : {}),
    });
  }
);

export default app;