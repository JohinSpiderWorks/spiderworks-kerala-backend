const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const AttributeValueProduct = sequelize.define(
  "product_variants",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUID
    },
    category_item_id_1: DataTypes.BIGINT,
    category_item_id_2: DataTypes.BIGINT,
    category_item_id_3: DataTypes.BIGINT,
    product_id: DataTypes.STRING,
    images: DataTypes.TEXT,
    stock: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(10, 2),
    status: DataTypes.STRING,
    // created_by: DataTypes.BIGINT,
    // updated_by: DataTypes.BIGINT,
  },
  {
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  }
);

module.exports = AttributeValueProduct;
