export function notFoundHandler(
  request,
  response
) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}

export function errorHandler(
  error,
  request,
  response,
  next
) {
  console.error(error);

  const statusCode =
    Number(error.statusCode) || 500;

  response.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error."
        : error.message,
    ...(process.env.NODE_ENV === "development"
      ? {
          error: error.message,
          stack: error.stack,
        }
      : {}),
  });
}