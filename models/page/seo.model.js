const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const pageSeoModel = sequelizeConfig.define(
  "pages_seo",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    page_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "pages",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
    paranoid: true,
    timestamps: true,
  }
);

module.exports = pageSeoModel;
