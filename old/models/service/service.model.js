const sequelizeConfig = require("../../config/sequelize.config");

const { DataTypes } = require("sequelize");

const serviceModel = sequelizeConfig.define(
  "services",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: "false",
    },
    publish_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: Date.now(),
    },
    premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING,
      references: {
        model: "users",
        key: "id",
      },
    },
    top_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    role: {
      type: DataTypes.ENUM(
        "user",
        "admin",
        "seo",
        "author",
        "member",
        "editor"
      ),
      allowNull: false,
      defaultValue: "user",
    },
    service_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

module.exports = serviceModel;
