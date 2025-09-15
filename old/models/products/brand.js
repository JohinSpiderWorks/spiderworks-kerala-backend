const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Brand = sequelize.define("brands", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  featured: DataTypes.BOOLEAN,
  name: DataTypes.STRING,
  slug: DataTypes.STRING,
  short_description: DataTypes.TEXT,
  logo: DataTypes.STRING,
  status: DataTypes.BOOLEAN,
  priority: DataTypes.INTEGER,
  created_by: DataTypes.BIGINT,
  updated_by: DataTypes.BIGINT,
  meta_title: DataTypes.STRING,
  meta_description: DataTypes.TEXT,
  meta_keywords: DataTypes.TEXT,
  og_title: DataTypes.STRING,
  og_description: DataTypes.TEXT,
  og_image: DataTypes.STRING,
  bottom_description: DataTypes.TEXT,

}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
});

module.exports = Brand;
