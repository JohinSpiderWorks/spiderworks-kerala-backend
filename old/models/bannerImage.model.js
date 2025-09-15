const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const bannerImageModel = sequelizeConfig.define(
  "blogimg",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    fieldname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    encoding: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    blog_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
    },
    image_type: {
      type: DataTypes.ENUM(
        "banner",
        "thumbanil",
        "featured",
        "attachment",
        "og"
      ),
      allowNull: true,
      defaultValue: "banner",
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

module.exports = bannerImageModel;
