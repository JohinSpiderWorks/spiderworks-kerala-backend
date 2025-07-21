const { ValidationError, ValidationErrorItem } = require("sequelize");

function errorHandler(err, req, res, next) {
    console.log('working');
  if (err instanceof ValidationErrorItem) {
    // Handle Sequelize validation errors
    const errors = err.message
    console.log({errors:errors});
    res.status(400).json({
      status: "error",
      message: errors.join(", "), 
    });
    next()
  }

  // Handle other types of errors
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
  next()

}

module.exports = errorHandler;
