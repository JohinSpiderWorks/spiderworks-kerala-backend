// models/GalleryFolder.js
const { Sequelize, DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config"); // Your database connection

const GalleryFolder = sequelizeConfig.define(
  "GalleryFolder",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
  },
  {
    tableName: "gallery_folders",
    timestamps: false,
  }
);

module.exports = GalleryFolder;
