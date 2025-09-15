const { Op } = require("sequelize");
const { default: axios } = require("axios");
const staticPageModel = require("../models/static-pages/static-page.model");
const GalleryMedia = require("../models/GalleryMedia");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Adjust to your storage path
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/webm"];
    if (
      validImageTypes.includes(file.mimetype) ||
      validVideoTypes.includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, MP4, or WebM allowed."
        )
      );
    }
  },
}).any(); // Allow any field names for files

// Helper function to extract key-value pairs from content
const extractKeyValuePairsFromContent = (contentStr) => {
  const result = [];
  const seen = new Set(); // To track uniqueness

  try {
    const contentObj = typeof contentStr === "string" ? JSON.parse(contentStr) : contentStr;

    const addUniqueItem = (heading, content, width = 'full') => {
      const key = `${heading}_${content}_${width}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ heading, content, width });
      }
    };

    // From fields
    if (Array.isArray(contentObj.fields)) {
      contentObj.fields.forEach((field) => {
        const heading = field.name?.replace(/\s+/g, '_') || '';
        const content = field.content || '';
        const width = field.width || 'full';
        addUniqueItem(heading, content, width);
      });
    }

    // From sections
    if (Array.isArray(contentObj.sections)) {
      contentObj.sections.forEach((section) => {
        const heading = section.heading?.replace(/\s+/g, '_') || '';
        const content = section.content || '';
        const width = section.width || 'full';
        addUniqueItem(heading, content, width);
      });
    }

    // Add short_description
    if (contentObj.short_description) {
      addUniqueItem('short_description', contentObj.short_description, 'full');
    }

  } catch (error) {
    console.error("Invalid content JSON:", error.message);
  }

  return result;
};

const staticPageBlogController = {
  createStaticPage: async (req, res) => {
    try {
      const {
        title,
        name,
        slug,
        status = true,
        fields = [],
        content = {},
      } = req.body;
      console.log("Received data:", req.body);

      const findStaticPage = await staticPageModel.findOne({
        where: {
          slug: slug,
        },
      });

      if (findStaticPage) {
        res.status(400).json({ message: "Static page already exists" });
        return;
      }

      // Create the static page in the database

      // Prepare data for frontend API
      const submitToData = {
        title: title,
        name: name || title,
        slug: slug,
        status: status,
        fields: fields,
        content: {
          fields: fields,
          short_description: content.short_description || "",
          sections: fields.map((field) => ({
            heading: field.name,
            content: field.content || "",
            width: field.width || "full",
          })),
        },
      };

      const newStaticPage = await staticPageModel.create({
        heading: name || title,
        name: name || title,
        slug: slug,
        content: JSON.stringify(submitToData.content),
        status: status,
      });

      // Create the page in Next.js
      const createNewPage = await axios.post(
        `${process.env.FRONTEND_URL}/api/static-page/${slug}`,
        submitToData
      );

      if (createNewPage?.data) {
        console.log("Frontend page created successfully");
      }

      res.status(201).json({
        message: "Static page created successfully",
        data: newStaticPage,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateStaticPageContent(req, res) {
    console.log(req);
    
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { slug: paramSlug } = req.params;
        const data = req.body;
        const files = req.files || [];

        const {
          title = null,
          heading = null,
          name = null,
          slug = null,
          status = null,
          content = "{}",
          seo = "{}",
        } = data;

        // Validate slug
        const effectiveSlug = paramSlug || slug;
        if (!effectiveSlug) {
          return res.status(400).json({
            success: false,
            message: "Slug is required in URL or payload",
          });
        }

        // Validate required fields
        if (!title && !heading) {
          return res
            .status(400)
            .json({ success: false, message: "Title or heading is required" });
        }

        const findStaticPage = await staticPageModel.findOne({
          where: { slug: effectiveSlug },
        });

        if (!findStaticPage) {
          return res
            .status(404)
            .json({ success: false, message: "Static page not found" });
        }

        // Parse content and seo
        let contents, seos;
        try {
          contents =
            typeof content === "string" ? JSON.parse(content) : content;
          if (!contents.fields) contents.fields = [];
          if (!contents.sections) contents.sections = [];
        } catch (error) {
          contents = { fields: [], sections: [] };
        }

        try {
          seos = typeof seo === "string" ? JSON.parse(seo) : seo;
        } catch (error) {
          seos = {};
        }

        // Process media files
        const mediaMap = {};
        let ogImageId = null;
        for (const file of files) {
          const mediaType =
            file.mimetype.split("/")[0] === "image"
              ? "Image"
              : file.mimetype.split("/")[0] === "video"
              ? "Video"
              : "Document";
          const galleryMedia = await GalleryMedia.create({
            media_name: file.originalname,
            src: `/uploads/${file.filename}`,
            file_type: mediaType,
            created_by: req.user?.id || 1,
            url: `/uploads/${file.filename}`,
            type: mediaType,
            filename: file.originalname,
            size: file.size,
            createdAt: new Date(),
          });
          mediaMap[file.fieldname] = galleryMedia.url;
          if (file.fieldname === "og_image") {
            ogImageId = galleryMedia.id;
          }
        }

        // Parse existing content
        let existingContent;
        try {
          existingContent = JSON.parse(findStaticPage.content || "{}");
        } catch (error) {
          existingContent = {};
        }

        if (!existingContent.fields) existingContent.fields = [];
        if (!existingContent.sections) existingContent.sections = [];

        // If files exist, update content.fields with file paths
        if (files && files.length > 0) {
          existingContent.fields = existingContent.fields.map((field) => {
            const matchedFile = files.find(
              (file) => file.fieldname === field.name
            );
            if (matchedFile) {
              return {
                ...field,
                content: `/uploads/${matchedFile.filename}`,
              };
            }
            return field;
          });
        }

        // Update fields logic depends on whether files are present
        let updatedFields = [];
        if (files && files.length > 0) {
          // If files are present, update/add fields but do not remove any
          updatedFields = [...existingContent.fields];
          if (contents.fields && Array.isArray(contents.fields)) {
            contents.fields.forEach((newField) => {
              const fieldName = newField.name;
              const existingFieldIndex = updatedFields.findIndex(
                (f) => f.name === fieldName
              );
              if (existingFieldIndex !== -1) {
                const existingField = updatedFields[existingFieldIndex];
                const propertiesToRemove = newField.removeProperties || [];
                let updatedContent = existingField.content;
                if (
                  typeof existingField.content === "object" &&
                  existingField.content !== null
                ) {
                  updatedContent = { ...existingField.content };
                  propertiesToRemove.forEach((propName) => {
                    if (updatedContent.hasOwnProperty(propName)) {
                      delete updatedContent[propName];
                    }
                  });
                } else if (
                  typeof existingField.content === "string" &&
                  propertiesToRemove.length > 0
                ) {
                  try {
                    const contentObj = JSON.parse(existingField.content);
                    propertiesToRemove.forEach((propName) => {
                      if (contentObj.hasOwnProperty(propName)) {
                        delete contentObj[propName];
                      }
                    });
                    updatedContent = contentObj;
                  } catch (e) {
                    updatedContent = existingField.content;
                  }
                }
                updatedFields[existingFieldIndex] = {
                  ...existingField,
                  type: newField.type || existingField.type,
                  width: newField.width || existingField.width,
                  enabled:
                    newField.enabled !== undefined
                      ? newField.enabled
                      : existingField.enabled,
                  content:
                    newField.content !== undefined
                      ? newField.content
                      : updatedContent,
                };
              } else {
                updatedFields.push({
                  name: fieldName,
                  type: newField.type || "text",
                  width: newField.width || "full",
                  enabled:
                    newField.enabled !== undefined ? newField.enabled : true,
                  content: newField.content || "",
                });
              }
            });
          }
        } else {
          // If no files, only keep fields present in incoming data
          if (contents.fields && Array.isArray(contents.fields)) {
            updatedFields = contents.fields.map((newField) => {
              const fieldName = newField.name;
              const existingField = existingContent.fields.find(
                (f) => f.name === fieldName
              );
              const propertiesToRemove = newField.removeProperties || [];
              let updatedContent = existingField
                ? existingField.content
                : undefined;
              if (
                existingField &&
                typeof existingField.content === "object" &&
                existingField.content !== null
              ) {
                updatedContent = { ...existingField.content };
                propertiesToRemove.forEach((propName) => {
                  if (updatedContent.hasOwnProperty(propName)) {
                    delete updatedContent[propName];
                  }
                });
              } else if (
                existingField &&
                typeof existingField.content === "string" &&
                propertiesToRemove.length > 0
              ) {
                try {
                  const contentObj = JSON.parse(existingField.content);
                  propertiesToRemove.forEach((propName) => {
                    if (contentObj.hasOwnProperty(propName)) {
                      delete contentObj[propName];
                    }
                  });
                  updatedContent = contentObj;
                } catch (e) {
                  updatedContent = existingField.content;
                }
              }
              return {
                name: fieldName,
                type:
                  newField.type ||
                  (existingField ? existingField.type : "text"),
                width:
                  newField.width ||
                  (existingField ? existingField.width : "full"),
                enabled:
                  newField.enabled !== undefined
                    ? newField.enabled
                    : existingField
                    ? existingField.enabled
                    : true,
                content:
                  newField.content !== undefined
                    ? newField.content
                    : updatedContent !== undefined
                    ? updatedContent
                    : "",
              };
            });
          }
        }

        // Update sections based on fields
        const updatedSections = updatedFields.map((field) => ({
          heading: field.name,
          content: field.content || "",
          width: field.width || "full",
        }));

        // Build the updated content object
        const updatedContent = {
          short_description:
            contents.short_description ||
            existingContent.short_description ||
            "",
          fields: updatedFields,
          sections: updatedSections,
        };

        // Update SEO
        const updatedSeo = {
          meta_title: seos.meta_title || findStaticPage.meta_title || "",
          meta_description:
            seos.meta_description || findStaticPage.meta_description || "",
          meta_keywords:
            seos.meta_keywords || findStaticPage.meta_keywords || "",
          og_title: seos.og_title || findStaticPage.og_title || "",
          og_description:
            seos.og_description || findStaticPage.og_description || "",
          bottom_description:
            seos.bottom_description || findStaticPage.bottom_description || "",
          og_image:
            ogImageId ||
            mediaMap.og_image ||
            seos.og_image ||
            findStaticPage.og_image ||
            null,
        };

        // Update the database record
        const [updatedCount] = await staticPageModel.update(
          {
            title: title || findStaticPage.title,
            heading: heading || title || findStaticPage.heading,
            name: name || title || findStaticPage.name,
            slug: effectiveSlug,
            content: JSON.stringify(updatedContent),
            status: status !== null ? status : findStaticPage.status,
            meta_title: updatedSeo.meta_title,
            meta_description: updatedSeo.meta_description,
            meta_keywords: updatedSeo.meta_keywords,
            og_title: updatedSeo.og_title,
            og_description: updatedSeo.og_description,
            bottom_description: updatedSeo.bottom_description,
            og_image: updatedSeo.og_image,
          },
          { where: { slug: effectiveSlug } }
        );

        if (updatedCount === 0) {
          return res
            .status(400)
            .json({ success: false, message: "No changes were made" });
        }

        // Prepare data for frontend update
        const submitToData = {
          title: title || heading || findStaticPage.title,
          name: name || title || findStaticPage.name,
          slug: effectiveSlug,
          status: status !== null ? status : findStaticPage.status,
          content: updatedContent,
          seo: updatedSeo,
        };

        try {
          // Send update to frontend
          const updateResponse = await axios.put(
            `${process.env.FRONTEND_URL}/api/static-page/${effectiveSlug}`,
            submitToData
          );

          if (!updateResponse.data.success) {
            throw new Error("Frontend update failed");
          }

          const updatedPage = await staticPageModel.findOne({
            where: { slug: effectiveSlug },
          });

          return res.status(200).json({
            success: true,
            message: "Static page updated successfully",
            data: updatedPage,
          });
        } catch (frontendError) {
          console.error("Frontend update error:", frontendError);
          // Revert changes if frontend update fails
          await staticPageModel.update(
            {
              title: findStaticPage.title,
              heading: findStaticPage.heading,
              name: findStaticPage.name,
              slug: findStaticPage.slug,
              content: findStaticPage.content,
              status: findStaticPage.status,
              meta_title: findStaticPage.meta_title,
              meta_description: findStaticPage.meta_description,
              meta_keywords: findStaticPage.meta_keywords,
              og_title: findStaticPage.og_title,
              og_description: findStaticPage.og_description,
              bottom_description: findStaticPage.bottom_description,
              og_image: findStaticPage.og_image,
            },
            { where: { slug: effectiveSlug } }
          );

          return res.status(500).json({
            success: false,
            message: "Frontend update failed, changes reverted1",
            error: frontendError.message,
          });
        }
      } catch (error) {
        console.error("Error updating static page:", error);
        return res.status(500).json({
          success: false,
          message: error.message,
          error: error,
        });
      }
    });
  },

  // getAllStaticPages: async (req, res) => {
  //   try {
  //     const { query, page = 1, limit = 10, status } = req?.query;
  //     const offset = (page - 1) * limit;

  //     let whereClause = {};
  //     if (query) {
  //       whereClause.heading = { [Op.iLike]: `%${query}%` };
  //     }
  //     if (status !== undefined && status !== "all") {
  //       whereClause.status = status === "true";
  //     }

  //     const { count, rows: allStaticPages } =
  //       await staticPageModel.findAndCountAll({
  //         where: whereClause,
  //         limit: parseInt(limit),
  //         offset: parseInt(offset),
  //         order: [["createdAt", "DESC"]],
  //       });

  //     // Add key-value pair to each page object
  //     const modifiedPages = allStaticPages.map((page) => {
  //       const keyValueContent = extractKeyValuePairsFromContent(page.content);
  //       return {
  //         ...page.toJSON(), // Convert Sequelize model to plain object
  //         contentKeyValue: keyValueContent,
  //       };
  //     });

  //     res.status(200).json({
  //       data: modifiedPages,
  //       pagination: {
  //         total: count,
  //         currentPage: parseInt(page),
  //         totalPages: Math.ceil(count / limit),
  //         limit: parseInt(limit),
  //       },
  //     });
  //   } catch (error) {
  //     res.status(500).json({ message: error.message });
  //   }
  // },
  getAllStaticPages: async (req, res) => {
    try {
      const { query, status } = req?.query;

      let whereClause = {};
      if (query) {
        whereClause.heading = { [Op.iLike]: `%${query}%` };
      }
      whereClause.status = status === "true";

      const allStaticPages = await staticPageModel.findAll({
        where: whereClause,
        order: [["createdAt", "DESC"]],
      });

      // Add key-value pair to each page object
      const modifiedPages = allStaticPages.map((page) => {
        const keyValueContent = extractKeyValuePairsFromContent(page.content);
        return {
          ...page.toJSON(), // Convert Sequelize model to plain object
          contentKeyValue: keyValueContent,
        };
      });

      res.status(200).json({
        data: modifiedPages,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  getStaticPageDetails: async (req, res) => {
    try {
      const { slug } = req.params;
      console.log({ slug });

      const findStaticPage = await staticPageModel.findOne({
        where: {
          slug: slug,
        },
        include: [
          {
            model: GalleryMedia,
            as: "og_img",
          },
        ],
      });
      console.log({ findStaticPage });

      // Extract key-value pairs from content
      const keyValueContent = extractKeyValuePairsFromContent(findStaticPage.content);

      res.status(200).json({
        data: {
          ...findStaticPage.toJSON(),
          contentKeyValue: keyValueContent,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateStaticPage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);

        const { id } = req.params;
        const data = req.body;
        const files = req.files || [];

        const {
          title = null,
          name = null,
          slug = null,
          status = null,
          fields = [],
          content = {},
          seo = {},
        } = data;

        console.log({ title });

        // Validate required fields
        if (!title || !slug) {
          return res
            .status(400)
            .json({ message: "Title and slug are required" });
        }

        const findStaticPage = await staticPageModel.findOne({
          where: { slug: id },
        });

        if (!findStaticPage) {
          return res.status(404).json({ message: "Static page not found" });
        }

        // Process media files
        const mediaMap = {};
        for (const file of files) {
          const mediaType =
            file.mimetype.split("/")[0] === "image"
              ? "Image"
              : file.mimetype.split("/")[0] === "video"
              ? "Video"
              : "Document";
          const galleryMedia = await GalleryMedia.create({
            media_name: file.originalname,
            src: `/uploads/${file.filename}`,
            file_type: mediaType,
            created_by: req.user?.id || 1, // Default to admin if no user
            url: `/uploads/${file.filename}`,
            type: mediaType,
            filename: file.originalname,
            size: file.size,
            createdAt: new Date(),
          });
          mediaMap[file.fieldname] = galleryMedia.id;
        }

        // Rest of the code remains the same...
        let updatedContent = {
          short_description:
            content.short_description ||
            findStaticPage.content?.short_description ||
            "",
          fields:
            content.fields || fields || findStaticPage.content?.fields || [],
          sections: content.sections || findStaticPage.content?.sections || [],
        };

        console.log({ content: updatedContent?.sections });

        if (updatedContent.sections) {
          updatedContent.sections = updatedContent.sections.map(
            (section, index) => {
              if (section.content && section.content.startsWith("media_")) {
                const mediaKey = section.content;
                section.content = mediaMap[mediaKey] || section.content;
              }
              return section;
            }
          );
        }

        let updatedSeo = {
          meta_title: seo.meta_title || findStaticPage.meta_title || "",
          meta_description:
            seo.meta_description || findStaticPage.meta_description || "",
          meta_keywords:
            seo.meta_keywords || findStaticPage.meta_keywords || "",
          og_title: seo.og_title || findStaticPage.og_title || "",
          og_description:
            seo.og_description || findStaticPage.og_description || "",
          bottom_description:
            seo.bottom_description || findStaticPage.bottom_description || "",
          og_image: seo.og_image || findStaticPage.og_image || null,
        };

        if (updatedSeo.og_image === "og_image" && mediaMap["og_image"]) {
          updatedSeo.og_image = mediaMap["og_image"];
        }

        const [updatedCount] = await staticPageModel.update(
          {
            heading: name || title || findStaticPage.heading,
            name: name || title || findStaticPage.name,
            slug: slug || findStaticPage.slug,
            content: JSON.stringify(updatedContent),
            status: status !== null ? status : findStaticPage.status,
            meta_title: updatedSeo.meta_title,
            meta_description: updatedSeo.meta_description,
            meta_keywords: updatedSeo.meta_keywords,
            og_title: updatedSeo.og_title,
            og_description: updatedSeo.og_description,
            bottom_description: updatedSeo.bottom_description,
            og_image: updatedSeo.og_image,
          },
          { where: { slug: id } }
        );

        if (updatedCount === 0) {
          return res.status(400).json({ message: "No changes were made" });
        }

        const submitToData = {
          title: title || findStaticPage.title,
          name: name || title || findStaticPage.name,
          slug: slug || findStaticPage.slug,
          status: status !== null ? status : findStaticPage.status,
          fields: fields || findStaticPage.content?.fields || [],
          content: updatedContent,
          seo: updatedSeo,
        };

        try {
          const updateResponse = await axios.put(
            `${process.env.FRONTEND_URL}/api/static-page/${slug}`,
            submitToData
          );

          if (!updateResponse.data.success) {
            throw new Error("Frontend update failed");
          }

          const updatedPage = await staticPageModel.findOne({
            where: { slug: id },
          });

          res.status(200).json({
            success: true,
            message: "Static page updated successfully",
            data: updatedPage,
          });
        } catch (frontendError) {
          await staticPageModel.update(
            {
              heading: findStaticPage.heading,
              name: findStaticPage.name,
              slug: findStaticPage.slug,
              content: findStaticPage.content,
              status: findStaticPage.status,
              meta_title: findStaticPage.meta_title,
              meta_description: findStaticPage.meta_description,
              meta_keywords: findStaticPage.meta_keywords,
              og_title: findStaticPage.og_title,
              og_description: findStaticPage.og_description,
              bottom_description: findStaticPage.bottom_description,
              og_image: findStaticPage.og_image,
            },
            { where: { slug: id } }
          );

          res.status(500).json({
            success: false,
            message: "Frontend update failed, changes reverted2",
            error: frontendError.message,
          });
        }
      } catch (error) {
        console.error("Error updating static page:", error);
        res.status(500).json({
          success: false,
          message: error.message,
          error: error,
        });
      }
    });
  },
  updateStaticPageStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const findStaticPage = await staticPageModel.findOne({
        where: { slug: id },
      });

      if (!findStaticPage) {
        return res.status(404).json({
          success: false,
          message: "Static page not found",
        });
      }

      const updatedCount = await staticPageModel.update(
        { status: status },
        { where: { slug: id } }
      );

      if (updatedCount[0] === 0) {
        return res.status(400).json({
          success: false,
          message: "No changes were made",
        });
      }

      const updatedPage = await staticPageModel.findOne({
        where: { slug: id },
      });

      return res.status(200).json({
        success: true,
        message: "Static page status updated successfully",
        data: updatedPage,
      });
    } catch (error) {
      console.error("Error updating static page status:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  },

  deleteStaticPage: async (req, res) => {
    try {
      const { id } = req.params;
      const findStaticPage = await staticPageModel.findByPk(id);

      if (!findStaticPage) {
        return res.status(404).json({ message: "Static page not found" });
      }

      await findStaticPage.destroy();

      await axios.delete(`${process.env.FRONTEND_URL}/api/static-page/${slug}`);

      return res
        .status(200)
        .json({ message: "Static page deleted successfully" });
    } catch (error) {
      console.error("Delete static page error:", error);
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = {
  staticPageBlogController,
};