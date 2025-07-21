const { logError, errorTypes } = require("../services/logger.service");

const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err, errorTypes.API, {
    route: req.path,
    method: req.method,
    userId: req.user?.id,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Prepare error response
  const errorResponse = {
    error: {
      message: err.message || "An unexpected error occurred",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
