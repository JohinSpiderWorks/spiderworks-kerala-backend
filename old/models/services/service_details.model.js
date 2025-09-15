const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");
const GalleryMedia = require("../GalleryMedia"); // Assuming GalleryMedia model path

const ServiceDetails = sequelizeConfig.define(
  "service_details",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Service names should likely be unique
      comment: "Name of the service page",
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Slugs must be unique for URL routing
      comment: "URL-friendly slug for the service page",
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Publication status (true for published, false for draft)",
    },
    // This field will store the entire dynamic structure of your sections
    // as a JSON object, matching the structure of serviceTemplates.serviceDetails.sections' data
    sections_content: {
      type: DataTypes.JSONB, // Use JSONB for better performance with JSON operations in PostgreSQL
      allowNull: true, // Allow null if a page can be created without all sections filled immediately
      comment: "Stores all dynamic content sections as a JSON object",
    },
    // Optional: If you want to explicitly store SEO fields separately for easier querying
    // You could also keep these within sections_content if preferred for full dynamism
    seo_h1_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "H1 title for SEO",
    },
    seo_bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Rich text description at the bottom for SEO",
    },
    seo_browser_keywords: {
      type: DataTypes.STRING, // Or TEXT if keywords can be long
      allowNull: true,
      comment: "Browser keywords (often comma-separated)",
    },
    seo_meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Meta title for search engines",
    },
    seo_meta_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Meta keywords for search engines",
    },
    seo_meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Meta description for search engines",
    },
    seo_og_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Open Graph title for social media sharing",
    },
    seo_og_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Open Graph description for social media sharing",
    },
    seo_og_image_id: {
      type: DataTypes.INTEGER, // Assuming GalleryMedia uses integer IDs
      allowNull: true,
      comment: "ID of the Open Graph image from GalleryMedia",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt columns
    freezeTableName: true, // Ensures the table name is 'service_details' and not pluralized
    paranoid: true, // Enables soft deletes (adds deletedAt column)
    comment: "Table for managing dynamic service page details",
  }
);

// ServiceDetails.belongsTo(GalleryMedia, {
//   as: "seoOgImage", // Alias for the association
//   foreignKey: "seo_og_image_id",
//   targetKey: "id",
//   onDelete: "SET NULL", // Set to NULL if the associated media is deleted
//   onUpdate: "CASCADE", // Update foreign key if media ID changes
// });

module.exports = ServiceDetails;
