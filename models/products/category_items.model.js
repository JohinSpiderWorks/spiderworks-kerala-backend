const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const CategoryItem = sequelize.define("category_items", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  label: DataTypes.STRING,
  icon: DataTypes.STRING,
  category_id: DataTypes.UUID,
  created_by: DataTypes.STRING,
  updated_by: DataTypes.STRING,
}, {
  timestamps: true,
  paranoid: true,
  freezeTableName: true,
});

module.exports = CategoryItem;
