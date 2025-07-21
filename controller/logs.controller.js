const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { LOGS_DIR } = require("../utils/logger");

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const getLogFiles = async () => {
  console.log("start log...", LOGS_DIR); // Debugging: Log the directory path
  try {
    const files = await readdir(LOGS_DIR);
    console.log("Files in directory:", files); // Debugging: Log the files found

    const fileStats = await Promise.all(
      files
        .filter((file) => file.endsWith(".log"))
        .map(async (file) => {
          const stats = await stat(path.join(LOGS_DIR, file));
          return {
            name: file,
            path: path.join(LOGS_DIR, file),
            size: stats.size,
            created: stats.birthtime,
          };
        })
    );

    console.log("Log file stats:", fileStats); // Debugging: Log the file details
    return fileStats;
  } catch (error) {
    console.error("Failed to read log directory:", error);
    throw new Error("Failed to read log directory");
  }
};

const readLogFile = async (filename) => {
  const filePath = path.join(LOGS_DIR, filename);
  try {
    const content = await readFile(filePath, "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    throw new Error("Failed to read log file");
  }
};

const deleteLogFile = async (filename) => {
  const filePath = path.join(LOGS_DIR, filename);
  try {
    await unlink(filePath);
  } catch (error) {
    throw new Error("Failed to delete log file");
  }
};

const deleteAllLogs = async () => {
  try {
    const files = await getLogFiles();
    await Promise.all(files.map((file) => unlink(file.path)));
  } catch (error) {
    throw new Error("Failed to delete all log files");
  }
};

module.exports = {
  getLogFiles,
  readLogFile,
  deleteLogFile,
  deleteAllLogs,
};
