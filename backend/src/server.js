import "dotenv/config";

import app from "./index.js";
import { env } from "./config/env.js";

import {
  closeDatabasePool,
} from "./config/database.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `Angelbird API running on http://localhost:${env.PORT}`
  );

  console.log(
    `Health check: http://localhost:${env.PORT}/api/health`
  );
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);

  server.close(async () => {
    try {
      await closeDatabasePool();
    } catch (error) {
      console.error(
        "Database pool close failed:",
        error.message
      );
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});