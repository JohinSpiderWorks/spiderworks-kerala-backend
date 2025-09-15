const { Op } = require("sequelize");
const { default: axios } = require("axios");
const ServiceDetails = require("../models/services/service_details.model"); // Adjust path as needed
const GalleryMedia = require("../models/GalleryMedia"); // Assuming GalleryMedia model path
const multer = require("multer");
//const upload = require("../config/multerConfig");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
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

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed!"), false);
    }
  },
});
const serviceDetailsController = {
  createServiceDetails: async (req, res) => {
    try {
      if (!req.body.name || !req.body.slug) {
        return res.status(400).json({
          success: false,
          message: "Name and slug are required fields",
        });
      }
      // Convert status to boolean
      const status = req.body.status === "true" || req.body.status === true;

      // Parse sections content
      let sectionsContent = {};
      try {
        sectionsContent =
          typeof req.body.sections_content === "string"
            ? JSON.parse(req.body.sections_content || "{}")
            : req.body.sections_content;
      } catch (e) {
        console.error("Failed to parse sections_content:", e);
        return res.status(400).json({
          success: false,
          message: "Invalid sections data format",
        });
      }

      // Handle SEO image if provided as ID
      let seoOgImageId = null;
      if (req.body.seo_og_image_id) {
        const media = await GalleryMedia.findByPk(req.body.seo_og_image_id);
        if (media) {
          seoOgImageId = media.id;
        }
      }

      // Create service record
      const serviceData = {
        name: req.body.name,
        slug: req.body.slug,
        status: status,
        sections_content: sectionsContent,
        ...(seoOgImageId && { seo_og_image_id: seoOgImageId }),
      };

      const service = await ServiceDetails.create(serviceData);

      return res.json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error("Service creation error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Add this new endpoint to get media for selection

  getMediaForSelection: async (req, res) => {
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
  },

  // createServiceDetails: async (req, res) => {
  //   upload.any()(req, res, async (err) => {
  //     if (err) {
  //       console.error("Upload error:", err);
  //       return res.status(400).json({
  //         success: false,
  //         message: err.message,
  //       });
  //     }

  //     try {
  //       console.log("Raw body:", req.body);
  //       console.log("Files:", req.files);

  //       // Convert status to boolean
  //       const status = req.body.status === "true";

  //       // Parse sections content safely
  //       let sectionsContent = {};
  //       try {
  //         sectionsContent = JSON.parse(req.body.sections_content || "{}");
  //       } catch (e) {
  //         console.error("Failed to parse sections_content:", e);
  //         return res.status(400).json({
  //           success: false,
  //           message: "Invalid sections data format",
  //         });
  //       }

  //       // Process files and update sections content
  //       const processFiles = (files) => {
  //         const fileMap = {};

  //         files.forEach((file) => {
  //           const fileUrl = `/uploads/${file.filename}`;

  //           // Extract the field path from the fieldname
  //           const fieldPath = file.fieldname
  //             .replace(/\]\[/g, ".")
  //             .replace(/\[/g, ".")
  //             .replace(/\]/g, "")
  //             .split(".");

  //           let current = fileMap;
  //           for (let i = 0; i < fieldPath.length - 1; i++) {
  //             const part = fieldPath[i];
  //             current[part] = current[part] || {};
  //             current = current[part];
  //           }

  //           current[fieldPath[fieldPath.length - 1]] = fileUrl;
  //         });

  //         return fileMap;
  //       };

  //       const fileMap = processFiles(req.files || []);

  //       // Merge file URLs into sections content
  //       const mergeFiles = (target, source) => {
  //         for (const key in source) {
  //           if (
  //             typeof source[key] === "object" &&
  //             !Array.isArray(source[key])
  //           ) {
  //             target[key] = target[key] || {};
  //             mergeFiles(target[key], source[key]);
  //           } else {
  //             target[key] = source[key];
  //           }
  //         }
  //       };

  //       mergeFiles(sectionsContent, fileMap.sections || {});

  //       // Handle SEO image separately
  //       const seoOgImage = req.files.find(
  //         (f) => f.fieldname === "seo_og_image"
  //       );
  //       let seoOgImageId = null;

  //       if (seoOgImage) {
  //         const fileUrl = `/uploads/${seoOgImage.filename}`;
  //         const media = await GalleryMedia.create({
  //           media_name: seoOgImage.originalname,
  //           src: fileUrl,
  //           file_type: seoOgImage.mimetype.startsWith("image/")
  //             ? "Image"
  //             : "Video",
  //           created_by: req.user?.id || 1,
  //           url: fileUrl,
  //         });
  //         seoOgImageId = media.id;
  //       }

  //       // Create service record
  //       const serviceData = {
  //         name: req.body.name,
  //         slug: req.body.slug,
  //         status: status,
  //         sections_content: sectionsContent,
  //         ...(seoOgImageId && { seo_og_image_id: seoOgImageId }),
  //       };

  //       const service = await ServiceDetails.create(serviceData);

  //       return res.json({
  //         success: true,
  //         data: service,
  //       });
  //     } catch (error) {
  //       console.error("Service creation error:", error);
  //       return res.status(500).json({
  //         success: false,
  //         message: "Internal server error",
  //       });
  //     }
  //   });
  // },

  updateServiceDetails: async (req, res) => {
    try {
      const { slug: paramSlug } = req.params;
      const {
        name,
        slug,
        status,
        sections_content,
        // SEO fields
        h1_title,
        bottom_description,
        browser_keywords,
        meta_title,
        meta_keywords,
        meta_description,
        og_title,
        og_description,
        og_image_url, // This should be the URL string from your media selection
      } = req.body;

      // Find the existing service
      const existingService = await ServiceDetails.findOne({
        where: { slug: paramSlug },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: "Service page not found",
        });
      }

      // Parse sections content if it's a string
      let parsedSections = existingService.sections_content || {};
      if (sections_content) {
        try {
          parsedSections =
            typeof sections_content === "string"
              ? JSON.parse(sections_content)
              : sections_content;
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: "Invalid sections_content format",
          });
        }
      }

      // Prepare update data
      const updateData = {
        name: name || existingService.name,
        slug: slug || existingService.slug,
        status: status !== undefined ? status : existingService.status,
        sections_content: parsedSections,
        // SEO fields
        seo_h1_title: h1_title || existingService.seo_h1_title,
        seo_bottom_description:
          bottom_description || existingService.seo_bottom_description,
        seo_browser_keywords:
          browser_keywords || existingService.seo_browser_keywords,
        seo_meta_title: meta_title || existingService.seo_meta_title,
        seo_meta_keywords: meta_keywords || existingService.seo_meta_keywords,
        seo_meta_description:
          meta_description || existingService.seo_meta_description,
        seo_og_title: og_title || existingService.seo_og_title,
        seo_og_description:
          og_description || existingService.seo_og_description,
      };

      // Handle OG image if URL is provided
      if (og_image_url) {
        // Find or create the media record
        const [media] = await GalleryMedia.findOrCreate({
          where: { url: og_image_url },
          defaults: {
            media_name: og_image_url.split("/").pop(),
            src: og_image_url,
            file_type: "Image",
            url: og_image_url,
            type: "Image",
            filename: og_image_url.split("/").pop(),
            size: 0, // You might want to get actual size if needed
            created_by: req.user?.id || 1,
          },
        });
        updateData.seo_og_image_id = media.id;
      }

      // Update the service
      const [updatedCount] = await ServiceDetails.update(updateData, {
        where: { slug: paramSlug },
      });

      if (updatedCount === 0) {
        return res.status(400).json({
          success: false,
          message: "No changes were made",
        });
      }

      // Get the updated service
      const updatedService = await ServiceDetails.findOne({
        where: { slug: slug || paramSlug },
      });

      return res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: {
          ...updatedService.toJSON(),
          // Include the full URL for the OG image if needed
          seo_og_image_url: og_image_url || null,
        },
      });
    } catch (error) {
      console.error("Error updating service:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update service",
        error: error.message,
      });
    }
  },
  /**
   * Retrieves all service detail pages with pagination and search.
   */
  getAllServiceDetails: async (req, res) => {
    try {
      const { query, page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {};
      if (query) {
        whereClause.name = { [Op.iLike]: `%${query}%` };
      }
      if (status !== undefined && status !== "all") {
        whereClause.status = status === "true";
      }

      const { count, rows: allServiceDetails } =
        await ServiceDetails.findAndCountAll({
          where: whereClause,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [["createdAt", "DESC"]],
          // Removed the include for GalleryMedia
        });

      const formattedServiceDetails = allServiceDetails.map((service) => ({
        ...service.toJSON(),
        // Removed seo_og_image_url since we're not including GalleryMedia
      }));

      res.status(200).json({
        success: true,
        data: formattedServiceDetails,
        pagination: {
          total: count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching all service details:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Retrieves a single service detail page by slug.
   */
  getServiceDetailsBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      const serviceData = await ServiceDetails.findOne({
        where: { slug: slug },
      });

      if (!serviceData) {
        return res
          .status(404)
          .json({ success: false, message: "Service page not found" });
      }

      res.status(200).json({
        success: true,
        data: serviceData,
      });
    } catch (error) {
      console.error("Error fetching service details by slug:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * Updates the status of a service detail page.
   */
  updateServiceDetailsStatus: async (req, res) => {
    try {
      const { slug } = req.params;
      const { status } = req.body;

      const findServicePage = await ServiceDetails.findOne({
        where: { slug: slug },
      });

      if (!findServicePage) {
        return res.status(404).json({
          success: false,
          message: "Service page not found",
        });
      }

      const [updatedCount] = await ServiceDetails.update(
        { status: status },
        { where: { slug: slug } }
      );

      if (updatedCount === 0) {
        return res.status(400).json({
          success: false,
          message: "No changes were made to the status",
        });
      }

      const updatedPage = await ServiceDetails.findOne({
        where: { slug: slug },
      });

      return res.status(200).json({
        success: true,
        message: "Service details status updated successfully",
        data: updatedPage,
      });
    } catch (error) {
      console.error("Error updating service details status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  /**
   * Deletes a service detail page by slug.
   */
  deleteServiceDetails: async (req, res) => {
    try {
      const { slug } = req.params; // Using slug for deletion

      const findServicePage = await ServiceDetails.findOne({
        where: { slug: slug },
      });

      if (!findServicePage) {
        return res
          .status(404)
          .json({ success: false, message: "Service page not found" });
      }

      await findServicePage.destroy(); // Soft delete due to `paranoid: true` in model

      // Optionally, notify frontend for deletion. Ensure frontend has a delete endpoint by slug.
      try {
        await axios.delete(
          `${process.env.FRONTEND_URL}/api/service-details/${slug}`
        );
      } catch (frontendError) {
        console.warn(
          "Frontend deletion notification failed (may not exist or already deleted):",
          frontendError.message
        );
        // Do not fail the backend operation if frontend notification fails
      }

      return res.status(200).json({
        success: true,
        message: "Service details page deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting service details page:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = {
  serviceDetailsController,
};
