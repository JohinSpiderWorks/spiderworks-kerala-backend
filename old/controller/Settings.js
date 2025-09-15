const multer = require("multer");
const path = require("path");
const fs = require("fs");
const siteSettingsModel = require("../models/Settings");
const socialMediaPlatformModel = require("../models/settings/SocialMediaSite");
const socialMediaLinksModel = require("../models/settings/SocialMediaLinks");

const addOrUpdateSettings = async (req, res) => {
  try {
    const {
      siteName,
      googleTagHead,
      googleTagBody,
      otherScripts,
      contactAddress1,
      contactAddress2,
      contactEmail,
      contactNumber,
      whatsappNumber,
      googleMapEmbed,
      facebookLink,
      twitterLink,
      linkedinLink,
      instagramLink,
      youtubeLink,
      otherSettings,
      clientId,
      clientSecret,
      redirectUri,
      googleLoginEnabled,
      logo,
      smallLogo,
      favicon,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpEncryption,
      smtpFromMail,
      smtpFromName,
    } = req.body;

    // Check if settings already exist
    let settings = await siteSettingsModel.findOne();

    if (settings) {
      // Update existing settings
      settings = await settings.update({
        siteName,
        googleTagHead,
        googleTagBody,
        otherScripts,
        contactAddress1,
        contactAddress2,
        contactEmail,
        contactNumber,
        whatsappNumber,
        googleMapEmbed,
        facebookLink,
        twitterLink,
        linkedinLink,
        instagramLink,
        youtubeLink,
        otherSettings,
        clientId,
        clientSecret,
        redirectUri,
        googleLoginEnabled,
        logo,
        smallLogo,
        favicon,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpEncryption,
        smtpFromMail,
        smtpFromName,
      });
    } else {
      // Create new settings
      settings = await siteSettingsModel.create({
        siteName,
        googleTagHead,
        googleTagBody,
        otherScripts,
        contactAddress1,
        contactAddress2,
        contactEmail,
        contactNumber,
        whatsappNumber,
        googleMapEmbed,
        facebookLink,
        twitterLink,
        linkedinLink,
        instagramLink,
        youtubeLink,
        otherSettings,
        clientId,
        clientSecret,
        redirectUri,
        googleLoginEnabled,
        logo,
        smallLogo,
        favicon,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpEncryption,
        smtpFromMail,
        smtpFromName,
      });
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSettingsNew = async (req, res) => {
  try {
    // Fetch the settings (assuming only one record exists)
    const settings = await siteSettingsModel.findAll({});

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No settings found",
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSection = async (req, res) => {
  try {
    const { section } = req.body; // Section is always in req.body
    let data = req.body.data; // Data comes from req.body.data for non-file uploads
    let settings = await siteSettingsModel.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No settings found",
      });
    }

    // Handle file uploads (logo, smallLogo, favicon)
    if (["logo", "smallLogo", "favicon"].includes(section)) {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required for this section",
        });
      }

      // Assuming you use a file upload middleware like multer
      const filePath = req.file.path; // Path where the file is stored
      settings[section] = filePath; // Update the respective field with file path
    } else {
      // Handle non-file sections
      if (!section || !data) {
        return res.status(400).json({
          success: false,
          message: "Section and data are required",
        });
      }

      // Update the specific section
      switch (section) {
        case "commonSettings":
          settings.siteName = data.siteName || settings.siteName;
          settings.googleTagHead = data.googleTagHead || settings.googleTagHead;
          settings.googleTagBody = data.googleTagBody || settings.googleTagBody;
          settings.otherScripts = data.otherScripts || settings.otherScripts;
          break;

        case "contactSettings":
          settings.contactAddress1 =
            data.contactAddress1 || settings.contactAddress1;
          settings.contactAddress2 =
            data.contactAddress2 || settings.contactAddress2;
          settings.contactEmail = data.contactEmail || settings.contactEmail;
          settings.contactNumber = data.contactNumber || settings.contactNumber;
          settings.whatsappNumber =
            data.whatsappNumber || settings.whatsappNumber;
          settings.googleMapEmbed =
            data.googleMapEmbed || settings.googleMapEmbed;
          break;

        case "socialMediaLinks":
          settings.facebookLink = data.facebookLink || settings.facebookLink;
          settings.twitterLink = data.twitterLink || settings.twitterLink;
          settings.linkedinLink = data.linkedinLink || settings.linkedinLink;
          settings.instagramLink = data.instagramLink || settings.instagramLink;
          settings.youtubeLink = data.youtubeLink || settings.youtubeLink;
          break;

        case "otherSettings":
          settings.otherSettings = data || settings.otherSettings; // Update the entire array
          break;

        case "googleLogin":
          settings.clientId = data.clientId || settings.clientId;
          settings.clientSecret = data.clientSecret || settings.clientSecret;
          settings.redirectUri = data.redirectUri || settings.redirectUri;
          settings.googleLoginEnabled =
            data.googleLoginEnabled !== undefined
              ? data.googleLoginEnabled
              : settings.googleLoginEnabled;
          break;

        case "smtpSettings":
          settings.smtpHost = data.smtpHost || settings.smtpHost;
          settings.smtpPort = data.smtpPort || settings.smtpPort;
          settings.smtpUser = data.smtpUser || settings.smtpUser;
          settings.smtpPassword = data.smtpPassword || settings.smtpPassword;
          settings.smtpEncryption =
            data.smtpEncryption || settings.smtpEncryption;
          settings.smtpFromMail = data.smtpFromMail || settings.smtpFromMail;
          settings.smtpFromName = data.smtpFromName || settings.smtpFromName;
          break;

        case "companySchema":
          settings.companyName = data.companyName || settings.companyName;
          settings.legalName = data.legalName || settings.legalName;
          settings.url = data.url || settings.url;
          settings.foundingDate = data.foundingDate || settings.foundingDate;
          settings.founderName = data.founderName || settings.founderName;
          settings.addressLocality =
            data.addressLocality || settings.addressLocality;
          settings.postalCode = data.postalCode || settings.postalCode;
          settings.streetAddress = data.streetAddress || settings.streetAddress;
          settings.addressRegion = data.addressRegion || settings.addressRegion;
          settings.addressCountry =
            data.addressCountry || settings.addressCountry;
          settings.countryCode = data.countryCode || settings.countryCode;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid section",
          });
      }
    }

    await settings.save(); // Save the updated settings

    res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      data: settings,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSocialMediaPlatform = async (req, res) => {
  try {
    const { name, status } = req.body;

    const createdBy = req.user.id;

    // Check if the name is provided
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Social media platform name is required",
      });
    }

    // Check if the social media platform already exists
    const existingPlatform = await socialMediaPlatformModel.findOne({
      where: { name },
    });

    if (existingPlatform) {
      return res.status(400).json({
        success: false,
        message: "Social media platform already exists",
      });
    }

    // Create a new social media platform entry
    const newPlatform = await socialMediaPlatformModel.create({
      name,
      createdBy,
      status: status || "active", // Default status is active if not provided
    });

    res.status(201).json({
      success: true,
      message: "Social media platform created successfully",
      data: newPlatform,
    });
  } catch (error) {
    console.error("Error creating social media platform:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getSocialMediaPlatforms = async (req, res) => {
  try {
    // Fetch all platforms from the database
    const platforms = await socialMediaPlatformModel.findAll({
      attributes: ["id", "name", "status"], // Select specific attributes
      order: [["name", "ASC"]], // Sort by name in ascending order
    });

    res.status(200).json({
      success: true,
      message: "Social media platforms fetched successfully",
      data: platforms,
    });
  } catch (error) {
    console.error("Error fetching social media platforms:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/logos");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error("Error creating uploads directory:", err);
}
// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
// Multer file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
});

// Middleware to handle single file upload
const uploadSingleLogo = upload.single("logo");

// Create a new social media link
const createSocialMediaLink = async (req, res) => {
  uploadSingleLogo(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Fixing issue with req.body being [Object: null prototype]
      req.body = JSON.parse(JSON.stringify(req.body));

      console.log("Request Body:", req.body);
      console.log("Request File:", req.file);

      const { socialMediaPlatformId, url } = req.body; // Ensure field names match frontend
      const createdBy = req.user.id;

      if (!socialMediaPlatformId || !url) {
        return res.status(400).json({
          success: false,
          message: "Platform and URL are required",
        });
      }

      // Fetch the platform ID
      const platformRecord = await socialMediaPlatformModel.findOne({
        where: { name: socialMediaPlatformId }, // Ensure consistency
      });

      if (!platformRecord) {
        return res.status(404).json({
          success: false,
          message: "Social media platform not found",
        });
      }

      let logoPath = null;
      if (req.file) {
        logoPath = `/uploads/logos/${req.file.filename}`;
      }

      // Create a new social media link
      const newSocialMediaLink = await socialMediaLinksModel.create({
        url,
        socialMediaPlatformId: platformRecord.id,
        logoPath,
        createdBy,
        status: "active",
      });

      res.status(201).json({
        success: true,
        message: "Social media link added successfully",
        data: newSocialMediaLink,
      });
    } catch (error) {
      console.error("Error adding social media link:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

const getAllSocialMediaLinks = async (req, res) => {
  try {
    // Fetch all social media links
    const socialMediaLinks = await socialMediaLinksModel.findAll();

    // Return the links in the response
    res.status(200).json({
      success: true,
      data: socialMediaLinks,
    });
  } catch (error) {
    console.error("Error fetching social media links:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSocialMediaLink = async (req, res) => {
  uploadSingleLogo(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // Fixing issue with req.body being [Object: null prototype]
      req.body = JSON.parse(JSON.stringify(req.body));

      console.log("Request Body:", req.body);
      console.log("Request File:", req.file);

      const { url, socialMediaPlatformId } = req.body;
      const linkId = req.params.id; // Assuming the link ID is passed as a URL parameter
      const updatedBy = req.user.id;

      // Validate required fields
      if (!url || !socialMediaPlatformId) {
        return res.status(400).json({
          success: false,
          message: "URL and platform are required",
        });
      }

      // Fetch the existing social media link to update
      const existingLink = await socialMediaLinksModel.findByPk(linkId);
      if (!existingLink) {
        return res.status(404).json({
          success: false,
          message: "Social media link not found",
        });
      }

      // Fetch the platform record
      const platformRecord = await socialMediaPlatformModel.findOne({
        where: { id: socialMediaPlatformId }, // Match by ID instead of name for updates
      });

      if (!platformRecord) {
        return res.status(404).json({
          success: false,
          message: "Social media platform not found",
        });
      }

      // Handle logo update if a new file is uploaded
      let logoPath = existingLink.logoPath; // Keep existing logo if no new file is uploaded
      if (req.file) {
        logoPath = `/uploads/logos/${req.file.filename}`;
      }

      // Update the social media link
      await existingLink.update({
        url,
        socialMediaPlatformId: platformRecord.id,
        logoPath,
        updatedBy,
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        message: "Social media link updated successfully",
        data: existingLink,
      });
    } catch (error) {
      console.error("Error updating social media link:", error);
      res
        .status(500)
        .json({ success: false, message: "Something went wrong!" });
    }
  });
};

const deleteSocialMediaLink = async (req, res) => {
  try {
    const linkId = req.params.id;
    const deletedBy = req.user.id;

    console.log(`Attempting to delete social media link with ID: ${linkId}`);

    const existingLink = await socialMediaLinksModel.findByPk(linkId);
    if (!existingLink) {
      console.log(`Social media link with ID ${linkId} not found`);
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    if (existingLink.logoPath) {
      console.log(`Raw logoPath from database: ${existingLink.logoPath}`);
      const uploadsDir = path.join(__dirname, "../uploads/logos");
      const logoFileName = path.basename(existingLink.logoPath);
      const logoFilePath = path.join(uploadsDir, logoFileName);

      console.log(`Full logo file path: ${logoFilePath}`);

      try {
        await fs.access(logoFilePath); // Check if file exists
        await fs.unlink(logoFilePath); // Delete file
        console.log(`Successfully deleted logo file: ${logoFilePath}`);
      } catch (fileError) {
        console.warn(
          `Logo file does not exist or could not be deleted: ${logoFilePath}`,
          fileError
        );
      }
    }

    await existingLink.destroy();
    console.log(`Successfully deleted social media link with ID: ${linkId}`);

    res.status(200).json({
      success: true,
      message: "Social media link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting social media link:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

module.exports = {
  addOrUpdateSettings,
  getSettingsNew,
  updateSection,
  createSocialMediaPlatform,
  getSocialMediaPlatforms,
  createSocialMediaLink,
  getAllSocialMediaLinks,
  updateSocialMediaLink,
  deleteSocialMediaLink,
};
