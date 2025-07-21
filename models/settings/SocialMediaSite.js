const sequelizeConfig = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const socialMediaPlatformModel = sequelizeConfig.define(
  "social_media_platform",
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
      unique: true,
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

module.exports = socialMediaPlatformModel;
