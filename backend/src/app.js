import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

import homeRoutes from "./routes/home.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import importsRoutes from "./routes/imports.routes.js";
import dataManagementRoutes from "./routes/dataManagement.routes.js";
import reportingPeriodsRoutes from "./routes/reportingPeriods.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import aiSatisfactionRoutes from "./routes/aiSatisfaction.routes.js";

/*
 * IMPORTANT:
 * Agar auth routes bhi project mein hain to unka existing
 * import aur app.use("/api/auth", authRoutes) retain karna.
 */

const app = express();

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

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const corsOptions = {
  origin(origin, callback) {
    /*
     * Postman, curl, Vercel internal requests
     * aur server-to-server calls mein Origin nahi hota.
     */
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
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

  exposedHeaders: [
    "Content-Length",
  ],

  maxAge: 86400,
};

app.use(cors(corsOptions));

/*
 * Do not use this with Express 5:
 *
 * app.options("*", cors());
 *
 * Global cors middleware already handles OPTIONS requests.
 */

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
 * Is route par database ya Supabase test mat chalao,
 * taake function basic boot check pass kare.
 */
app.get("/", (request, response) => {
  response.status(200).json({
    success: true,
    message:
      "Angelbird Analysis API is running.",
    environment:
      env.NODE_ENV,
    platform:
      env.IS_VERCEL
        ? "vercel"
        : "local",
    timestamp:
      new Date().toISOString(),
  });
});

/*
 * Basic server health.
 */
app.get(
  "/api/health",
  (request, response) => {
    response.status(200).json({
      success: true,
      message:
        "Angelbird Analysis API is healthy.",
      environment:
        env.NODE_ENV,
      platform:
        env.IS_VERCEL
          ? "vercel"
          : "local",
      timestamp:
        new Date().toISOString(),
    });
  }
);

/*
 * Registered API routes.
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
 * API not-found handler.
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

        stack:
          error?.stack,
      }
    );

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

    response.status(
      statusCode
    ).json({
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