const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const Product = sequelize.define(
  "products",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue:DataTypes.UUIDV4
    },
    brand_id: DataTypes.BIGINT,
    title: DataTypes.STRING,
    slug: DataTypes.STRING,
    description: DataTypes.TEXT,
    short_description: DataTypes.TEXT,
    status: DataTypes.STRING,
    banner_image_id: DataTypes.STRING,
    featured_image_id: DataTypes.STRING,
    info: DataTypes.TEXT,
    // youtube_link: DataTypes.STRING,
    category_id_1: DataTypes.UUID,
    category_id_2: DataTypes.UUID,
    category_id_3: DataTypes.UUID,
    // SEO Fields
    meta_title:DataTypes.STRING,
    meta_description: DataTypes.TEXT,
    meta_keywords: DataTypes.TEXT,
    og_title: DataTypes.STRING,
    og_description: DataTypes.TEXT,
    og_image_id: DataTypes.STRING,
    // Additional Fields
    bottom_description: DataTypes.TEXT,
    is_featured: DataTypes.BOOLEAN,
    is_product: DataTypes.BOOLEAN,
    // created_by: DataTypes.BIGINT,
    // updated_by: DataTypes.BIGINT,
  },
  {
    timestamps: true,
    freezeTableName: true,
  }
);

module.exports = Product;
