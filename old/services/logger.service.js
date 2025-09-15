// src/services/logger.service.js
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");

const LOGS_DIR = path.join(process.cwd(), "logs");

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
  const dateStamp = format(new Date(), "yyyy-MM-dd");
  return `${dateStamp}_${type}.log`;
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
      ...additionalData,
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n", { flag: "a" });
  } catch (logErr) {
    console.error("Failed to write to error log:", logErr);
  }
};

const getLogFiles = async () => {
  try {
    const files = await fs.promises.readdir(LOGS_DIR);
    const logFiles = files.filter((file) => file.endsWith(".log"));

    const filesWithStats = await Promise.all(
      logFiles.map(async (file) => {
        const stats = await fs.promises.stat(path.join(LOGS_DIR, file));
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
    );

    return filesWithStats.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    throw new Error("Failed to read log directory");
  }
};

const readLogFile = async (filename) => {
  try {
    const content = await fs.promises.readFile(
      path.join(LOGS_DIR, filename),
      "utf8"
    );
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    throw new Error("Failed to read log file");
  }
};

const deleteLogFile = async (filename) => {
  try {
    await fs.promises.unlink(path.join(LOGS_DIR, filename));
  } catch (error) {
    throw new Error("Failed to delete log file");
  }
};

const deleteAllLogs = async () => {
  try {
    const files = await getLogFiles();
    await Promise.all(
      files.map((file) => fs.promises.unlink(path.join(LOGS_DIR, file.name)))
    );
  } catch (error) {
    throw new Error("Failed to delete all log files");
  }
};

module.exports = {
  logError,
  errorTypes,
  getLogFiles,
  readLogFile,
  deleteLogFile,
  deleteAllLogs,
};
