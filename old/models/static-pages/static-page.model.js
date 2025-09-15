const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");
const GalleryMedia = require("../GalleryMedia");

const staticPageModel = sequelizeConfig.define(
  "staticpage",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    heading: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    og_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    og_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    og_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

staticPageModel.belongsTo(GalleryMedia, {
  as: "og_img",
  foreignKey: "og_image",
  targetKey: "id",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

module.exports = staticPageModel;
