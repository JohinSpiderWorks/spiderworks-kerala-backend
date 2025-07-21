const path = require("path");
const fs = require("fs");

exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = `/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      data: {
        id: req.file.filename,
        media_name: req.file.originalname,
        url: filePath,
        file_type: req.file.mimetype.startsWith("video") ? "Video" : "Image",
        created_at: new Date(),
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
};

exports.getMedia = async (req, res) => {
  try {
    const { type = "image", search = "" } = req.query;
    const uploadsDir = path.join(__dirname, "../uploads");

    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        message: "Uploads directory doesn't exist",
      });
    }

    // Read all files from uploads directory
    let files;
    try {
      files = fs.readdirSync(uploadsDir);
    } catch (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).json({
        success: false,
        message: "Error reading uploads directory",
      });
    }

    // Filter files based on type and search term
    const filteredFiles = files.filter((file) => {
      // Skip directories (just in case)
      if (fs.statSync(path.join(uploadsDir, file)).isDirectory()) {
        return false;
      }

      // Check file type
      const isImage = /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file);
      const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(file);

      // Check if file matches requested type
      const typeMatch = type === "video" ? isVideo : isImage;

      // Check if file matches search term (case insensitive)
      const searchMatch = search
        ? file.toLowerCase().includes(search.toLowerCase())
        : true;

      return typeMatch && searchMatch;
    });

    // Create response data
    const mediaItems = filteredFiles.map((file) => {
      const filePath = `/uploads/${file}`;
      const stats = fs.statSync(path.join(uploadsDir, file));

      return {
        id: file, // Using filename as ID
        media_name: file,
        url: filePath,
        file_type: type === "video" ? "Video" : "Image",
        created_at: stats.birthtime,
        size: stats.size,
        last_modified: stats.mtime,
      };
    });

    // Sort by creation date (newest first)
    mediaItems.sort((a, b) => b.created_at - a.created_at);

    return res.json({
      success: true,
      data: mediaItems,
      total: mediaItems.length,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch media",
      error: error.message,
    });
  }
};
