const sequelizeConfig = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const socialMediaLinksModel = sequelizeConfig.define(
  "social_media_links",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    socialMediaPlatformId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "social_media_platform",
        key: "id",
      },
    },
    logoPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
      allowNull: false,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

module.exports = socialMediaLinksModel;
