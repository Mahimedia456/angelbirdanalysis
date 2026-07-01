import "dotenv/config";

export default async function handler(request, response) {
  try {
    const module = await import("../src/index.js");
    const app = module.default;

    if (typeof app !== "function") {
      return response.status(500).json({
        success: false,
        code: "INVALID_EXPRESS_EXPORT",
        message:
          "src/index.js did not export a valid Express application.",
      });
    }

    return app(request, response);
  } catch (error) {
    console.error("Backend startup/import failed:", error);

    return response.status(500).json({
      success: false,
      code: "BACKEND_STARTUP_FAILED",
      message:
        error?.message || "Backend failed during startup.",
      name: error?.name || "Error",
      stack:
        process.env.NODE_ENV === "production"
          ? undefined
          : error?.stack,
    });
  }
}