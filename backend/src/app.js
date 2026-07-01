import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

/*
 * IMPORTANT:
 * Auth route register hona lazmi hai because frontend calls:
 * POST /api/auth/login
 */
import authRoutes from "./routes/auth.routes.js";

import homeRoutes from "./routes/home.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import importsRoutes from "./routes/imports.routes.js";
import dataManagementRoutes from "./routes/dataManagement.routes.js";
import reportingPeriodsRoutes from "./routes/reportingPeriods.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import aiSatisfactionRoutes from "./routes/aiSatisfaction.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://reportangelbird.mahimediasolutions.com",

    ...(Array.isArray(env.FRONTEND_URLS)
      ? env.FRONTEND_URLS
      : []),
  ])
);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error(
      `CORS blocked request from origin: ${origin}`
    );

    error.statusCode = 403;
    error.code = "CORS_ORIGIN_BLOCKED";

    callback(error);
  },

  /*
   * Frontend apiClient uses credentials: "include".
   * Therefore Access-Control-Allow-Origin cannot be "*".
   */
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
    "Origin",
  ],

  exposedHeaders: [
    "Content-Length",
  ],

  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400,
};

/*
 * CORS must run before Helmet, JSON parser and all routes.
 */
app.use(cors(corsOptions));

/*
 * Explicit Express 5-compatible OPTIONS handler.
 * Regex use ki gayi hai; app.options("*") use nahi karna.
 */
app.options(
  /^(.*)$/,
  cors(corsOptions)
);

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

/*
 * Dependency-free root route.
 */
app.get("/", (request, response) => {
  response.status(200).json({
    success: true,
    message:
      "Angelbird Analysis API is running.",
    environment: env.NODE_ENV,
    platform: env.IS_VERCEL
      ? "vercel"
      : "local",
    timestamp:
      new Date().toISOString(),
  });
});

app.get(
  "/api/health",
  (request, response) => {
    response.status(200).json({
      success: true,
      message:
        "Angelbird Analysis API is healthy.",
      environment: env.NODE_ENV,
      platform: env.IS_VERCEL
        ? "vercel"
        : "local",
      allowedOrigins,
      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
 * Authentication route was missing previously.
 */
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
 * 404 handler.
 */
app.use(
  (request, response) => {
    response.status(404).json({
      success: false,

      message:
        `Route not found: ${request.method} ${request.originalUrl}`,

      code:
        "ROUTE_NOT_FOUND",
    });
  }
);

/*
 * Central error handler.
 */
app.use(
  (
    error,
    request,
    response,
    next
  ) => {
    const statusCode =
      Number(
        error?.statusCode ||
          error?.status ||
          500
      ) || 500;

    console.error(
      "Angelbird API Error:",
      {
        message:
          error?.message,

        code:
          error?.code,

        status:
          statusCode,

        method:
          request.method,

        path:
          request.originalUrl,

        origin:
          request.headers.origin,

        stack:
          error?.stack,
      }
    );

    /*
     * Ensure even error responses carry
     * the production CORS origin.
     */
    const requestOrigin =
      request.headers.origin;

    if (
      requestOrigin &&
      isAllowedOrigin(
        requestOrigin
      )
    ) {
      response.setHeader(
        "Access-Control-Allow-Origin",
        requestOrigin
      );

      response.setHeader(
        "Access-Control-Allow-Credentials",
        "true"
      );

      response.setHeader(
        "Vary",
        "Origin"
      );
    }

    if (
      error?.status === 429 ||
      error?.code ===
        "insufficient_quota" ||
      error?.error?.code ===
        "insufficient_quota"
    ) {
      response.status(503).json({
        success: false,

        message:
          "AI analysis is temporarily unavailable because the OpenAI API project has no available quota.",

        code:
          "AI_QUOTA_UNAVAILABLE",
      });

      return;
    }

    if (
      error?.code ===
      "CORS_ORIGIN_BLOCKED"
    ) {
      response.status(403).json({
        success: false,
        message:
          error.message,
        code:
          error.code,
      });

      return;
    }

    response
      .status(statusCode)
      .json({
        success: false,

        message:
          error?.message ||
          "Internal server error.",

        code:
          error?.code ||
          "INTERNAL_SERVER_ERROR",

        ...(env.NODE_ENV !==
        "production"
          ? {
              stack:
                error?.stack,
            }
          : {}),
      });
  }
);

export default app;