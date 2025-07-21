const ListItemData = require("../models/list/listItem.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { log } = require("console");

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/listItems/";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-flv",
    "video/webm",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and videos are allowed."),
      false
    );
  }
};

// Change the multer configuration to preserve non-file fields
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
}).any();

exports.createItem = async (req, res) => {
  try {
    // Handle file uploads first
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            reject(new Error(err.message));
          } else {
            reject(err);
          }
        }
        resolve();
      });
    });

    const { listId, ...otherFields } = req.body;

    if (!listId) {
      return res.status(400).json({ message: "listId is required." });
    }

    // Parse any JSON strings in the request body
    const parsedData = {};
    for (const [key, value] of Object.entries(otherFields)) {
      try {
        // Try to parse as JSON if it's a string
        parsedData[key] = typeof value === "string" ? JSON.parse(value) : value;
      } catch (e) {
        // If parsing fails, use the original value
        parsedData[key] = value;
      }
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        parsedData[file.fieldname] = `/uploads/listItems/${file.filename}`;
      });
    }

    const newItem = await ListItemData.create({
      listId,
      data: parsedData,
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      message: error.message || "Server error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const { listId } = req.params;

    const items = await ListItemData.findAll({
      where: { listId },
    });

    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ListItemData.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.updateItem = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { data } = req.body;

//     const item = await ListItemData.findByPk(id);
//     if (!item) {
//       return res.status(404).json({ message: "Item not found" });
//     }

//     item.data = data ?? item.data;
//     await item.save();

//     res.status(200).json(item);
//   } catch (error) {
//     console.error("Error updating item:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Initialize empty data object if none provided
    let data = req.body.data || {};

    // Handle stringified JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        // If parsing fails, treat as regular string
        data = { value: data };
      }
    }

    // Ensure data is always an object
    if (typeof data !== "object" || data === null) {
      data = {};
    }

    const item = await ListItemData.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Merge new data with existing data
    item.data = { ...item.data, ...data };
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ListItemData.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.destroy(); // soft delete if paranoid:true
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Server error" });
  }
};
