const GalleryMedia = require("../models/GalleryMedia");
const GalleryFolder = require("../models/GalleryFolder");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/gallery/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).array("media", 10);

const uploadGalleryMedia = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res
          .status(400)
          .json({ message: "File upload failed", error: err.message });
      }

      const files = req.files;
      const createdBy = req.user.id;
      const folderId = req.body.folder_id || null;

      const mediaRecords = files.map((file) => ({
        media_name: file.originalname,
        filename: file.filename,
        file_type: file.mimetype.startsWith("image")
          ? "Image"
          : file.mimetype.startsWith("video")
          ? "Video"
          : "Document",
        status: "active",
        created_by: createdBy,
        folder_id: folderId,
      }));

      const uploadedMedia = await GalleryMedia.bulkCreate(mediaRecords);

      const mediaWithUrls = uploadedMedia.map((media) => ({
        ...media.toJSON(),
        file_url: `${process.env.BACKEND_URL}/uploads/gallery/${media.filename}`,
      }));

      res.status(201).json({
        message: "Files uploaded successfully",
        media: mediaWithUrls,
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchGalleryMedia = async (req, res) => {
  try {
    const galleryMedia = await GalleryMedia.findAll({
      where: { folder_id: null },
      order: [["created_date", "DESC"]],
    });

    const mediaWithUrls = galleryMedia.map((media) => ({
      ...media.toJSON(),
      file_url: `${process.env.BACKEND_URL}/uploads/gallery/${media.filename}`,
    }));

    res.status(200).json({
      message: "Gallery media fetched successfully",
      data: mediaWithUrls,
    });
  } catch (error) {
    console.error("Error fetching gallery media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteGalleryMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await GalleryMedia.findOne({ where: { id } });

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await GalleryMedia.destroy({ where: { id } });

    res.status(200).json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting gallery media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createGalleryFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await GalleryFolder.create({
      name,
      created_by: req.user.id,
    });

    res.status(201).json({
      message: "Folder created successfully",
      data: folder.toJSON(),
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchGalleryFolders = async (req, res) => {
  try {
    const folders = await GalleryFolder.findAll({
      order: [["created_date", "DESC"]],
    });

    res.status(200).json({
      message: "Folders fetched successfully",
      data: folders.map((folder) => folder.toJSON()),
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchFolderMedia = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await GalleryFolder.findOne({ where: { id: folderId } });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const galleryMedia = await GalleryMedia.findAll({
      where: { folder_id: folderId },
      order: [["created_date", "DESC"]],
    });

    const mediaWithUrls = galleryMedia.map((media) => ({
      ...media.toJSON(),
      file_url: `${process.env.BACKEND_URL}/uploads/gallery/${media.filename}`,
    }));

    res.status(200).json({
      message: "Folder media fetched successfully",
      data: mediaWithUrls,
    });
  } catch (error) {
    console.error("Error fetching folder media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteGalleryFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await GalleryFolder.findOne({ where: { id: folderId } });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Delete all media in the folder
    const media = await GalleryMedia.findAll({
      where: { folder_id: folderId },
    });
    for (const item of media) {
      const filePath = path.join(uploadDir, item.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await GalleryMedia.destroy({ where: { folder_id: folderId } });

    // Delete the folder
    await GalleryFolder.destroy({ where: { id: folderId } });

    res
      .status(200)
      .json({ message: "Folder and its contents deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const moveGalleryMedia = async (req, res) => {
  try {
    const { mediaIds, folderId } = req.body;
    if (!mediaIds || !mediaIds.length) {
      return res.status(400).json({ message: "Media IDs are required" });
    }

    // If folderId is provided, verify it exists; if null, it's valid (root)
    if (folderId) {
      const folder = await GalleryFolder.findOne({ where: { id: folderId } });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
    }

    const updatedCount = await GalleryMedia.update(
      { folder_id: folderId || null }, // Explicitly allow null for root
      { where: { id: mediaIds } }
    );

    if (updatedCount[0] === 0) {
      return res.status(404).json({ message: "No media found to move" });
    }

    res.status(200).json({ message: "Media moved successfully" });
  } catch (error) {
    console.error("Error moving media:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const renameGalleryFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await GalleryFolder.findOne({ where: { id: folderId } });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    await GalleryFolder.update({ name }, { where: { id: folderId } });

    const updatedFolder = await GalleryFolder.findOne({
      where: { id: folderId },
    });

    res.status(200).json({
      message: "Folder renamed successfully",
      data: updatedFolder.toJSON(),
    });
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchAllMedias = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const medias = await GalleryMedia.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_date", "DESC"]],
      include: [
        {
          model: GalleryFolder,
          as: "media_folder",
          attributes: ["id", "name"],
        },
      ],
    });

    res.status(200).json({
      data: medias.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(medias.count / limit),
        totalItems: medias.count,
      },
    });
  } catch (error) {
    console.log({ err: error?.message });
    res.status(500).json({ err: error?.message });
  }
};

module.exports = {
  uploadGalleryMedia,
  fetchGalleryMedia,
  deleteGalleryMedia,
  createGalleryFolder,
  fetchGalleryFolders,
  fetchFolderMedia,
  deleteGalleryFolder,
  moveGalleryMedia,
  renameGalleryFolder,
  fetchAllMedias,
};
