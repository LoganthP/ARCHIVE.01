/**
 * Global error handling middleware for Express.
 * Catches all errors passed via next(err) and returns structured JSON responses.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // API specific errors

  // Validation errors
  if (err.status === 400) {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
  }

  // Not found
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message,
    });
  }

  // Default: Internal server error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
  });
}

/**
 * Wrapper for async route handlers.
 * Catches rejected promises and passes them to the error handler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default { errorHandler, asyncHandler };
