const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const Order = require("./order");
const AttributeValueProduct = require("./product_variants.model");

const OrderItem = sequelize.define(
  "order_items",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    product_variant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    price_at_purchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  },
  {
    timestamps: false,
    underscored: true
  }
);

// OrderItem.belongsTo(Order, {
//   foreignKey: 'order_id',
//   as: 'order'
// });

OrderItem.belongsTo(AttributeValueProduct, {
  foreignKey: 'product_variant_id',
  as: 'product_order_variant'
});

module.exports = OrderItem;
