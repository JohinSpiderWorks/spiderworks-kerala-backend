const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Product_Category = sequelize.define("product_category", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  short_description:DataTypes.TEXT,
  slug:DataTypes.STRING,
  featured:DataTypes.BOOLEAN,
  name: DataTypes.STRING,
  status: DataTypes.BOOLEAN,
  created_by: DataTypes.STRING,
  updated_by:DataTypes.STRING,
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

module.exports = Product_Category;
