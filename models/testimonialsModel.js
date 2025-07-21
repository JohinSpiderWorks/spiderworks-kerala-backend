const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const testimonialsModel = sequelizeConfig.define(
  "testimonials",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT, // Use TEXT for longer descriptions
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author_photo: {
      type: DataTypes.STRING, // URL to the author's photo
      allowNull: true, // Optional field
    },
    type: {
      type: DataTypes.ENUM("text", "image", "video_embed", "video_attachment"), // Restrict to specific types
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video_url: {
      type: DataTypes.STRING, // URL to the video
      allowNull: true, // Optional field
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
    freezeTableName: true,
    paranoid: true, // Adds `deletedAt` field for soft deletes
  }
);

module.exports = testimonialsModel;
