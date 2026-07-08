import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import homeRoutes from "./routes/home.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import importsRoutes from "./routes/imports.routes.js";
import dataManagementRoutes from "./routes/dataManagement.routes.js";
import reportingPeriodsRoutes from "./routes/reportingPeriods.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import aiSatisfactionRoutes from "./routes/aiSatisfaction.routes.js";
import sheetReportsRoutes from "./routes/sheetReportsRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://reportangelbird.mahimediasolutions.com",
];

if (env.FRONTEND_URL) {
  String(env.FRONTEND_URL)
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean)
    .forEach((origin) => {
      if (!allowedOrigins.includes(origin)) {
        allowedOrigins.push(origin);
      }
    });
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error(
      `CORS blocked request from origin: ${origin}`
    );

    error.statusCode = 403;
    callback(error);
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
    "Accept",
    "Content-Type",
    "Authorization",
    "X-API-Key",
  ],

  optionsSuccessStatus: 204,
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

/*
 * CORS sab se pehle.
 * app.options("*") bilkul use nahi karna.
 */
app.use(cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    crossOriginEmbedderPolicy: false,
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

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (request, response) => {
  response.status(200).json({
    success: true,
    message: "Angelbird Analysis API is running.",
    environment: env.NODE_ENV,
    platform: process.env.VERCEL ? "vercel" : "local",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "Angelbird Analysis API is healthy.",
    allowedOrigins,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/imports", importsRoutes);
app.use("/api/data-management", dataManagementRoutes);
app.use("/api/reporting-periods", reportingPeriodsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai/satisfaction", aiSatisfactionRoutes);
app.use("/api/sheets", sheetReportsRoutes);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

app.use((error, request, response, next) => {
  console.error("Angelbird API Error:", {
    message: error?.message,
    code: error?.code,
    method: request.method,
    path: request.originalUrl,
    origin: request.headers.origin,
    stack: error?.stack,
  });

  if (
    error?.status === 429 ||
    error?.code === "insufficient_quota" ||
    error?.error?.code === "insufficient_quota"
  ) {
    return response.status(503).json({
      success: false,
      code: "AI_QUOTA_UNAVAILABLE",
      message:
        "AI analysis is temporarily unavailable because API quota is unavailable.",
    });
  }

  const statusCode =
    Number(error?.statusCode || error?.status) || 500;

  return response.status(statusCode).json({
    success: false,
    code: error?.code || "INTERNAL_SERVER_ERROR",
    message: error?.message || "Internal server error.",
    ...(env.NODE_ENV !== "production"
      ? {
          stack: error?.stack,
        }
      : {}),
  });
});

export default app;