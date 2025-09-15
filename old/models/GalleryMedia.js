// models/GalleryMedia.js
const { Sequelize, DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config"); // Your database connection
const GalleryFolder = require("./GalleryFolder");

const GalleryMedia = sequelizeConfig.define(
  "GalleryMedia",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    media_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    src: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.ENUM("Image", "Video", "Document"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    folder_id: {
      type: DataTypes.STRING,
      allowNull: true, // Null means media is in the root gallery
      references: {
        model: "gallery_folders", // Table name for GalleryFolder
        key: "id",
      },
    },
  },
  {
    tableName: "gallery_media",
    timestamps: false,
  }
);

GalleryMedia.belongsTo(GalleryFolder,{
  foreignKey:'folder_id',
  as:'media_folder'
})

module.exports = GalleryMedia;
