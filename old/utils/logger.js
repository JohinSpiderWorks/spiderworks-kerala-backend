const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

const LOGS_DIR = path.join(__dirname, "../Logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const errorTypes = {
  DB: "Database",
  AUTH: "Authentication",
  VALIDATION: "Validation",
  API: "API",
  SERVER: "Server",
  UNKNOWN: "Unknown",
};

const getLogFileName = (type) => {
  const dateStamp = format(new Date(), "dd-MMMM-yyyy");
  return `${dateStamp}_${type}_errors.log`;
};

const logError = (error, type = errorTypes.UNKNOWN, additionalData = {}) => {
  try {
    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    const logFile = path.join(LOGS_DIR, getLogFileName(type));

    const logEntry = {
      timestamp,
      type,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      additionalData,
      route: additionalData.route || "N/A",
      method: additionalData.method || "N/A",
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n", { flag: "a" });
  } catch (logErr) {
    console.error("Failed to write to error log:", logErr);
  }
};

module.exports = {
  logError,
  errorTypes,
  LOGS_DIR,
};
