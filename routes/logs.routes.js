// src/routes/logs.routes.js
const express = require("express");
const router = express.Router();
const {
  getLogFiles,
  readLogFile,
  deleteLogFile,
  deleteAllLogs,
} = require("../services/logger.service");
//const { authenticate, authorize } = require("../middleware/auth");

// Admin only routes

router.get("/", async (req, res, next) => {
  try {
    const files = await getLogFiles();
    res.json(files);
  } catch (error) {
    next(error);
  }
});

router.get("/:filename", async (req, res, next) => {
  try {
    const content = await readLogFile(req.params.filename);
    res.json(content);
  } catch (error) {
    next(error);
  }
});

router.delete("/:filename", async (req, res, next) => {
  try {
    await deleteLogFile(req.params.filename);
    res.json({ message: "Log file deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    await deleteAllLogs();
    res.json({ message: "All log files deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
