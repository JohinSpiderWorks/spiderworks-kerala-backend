const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const userModel = require("../user.model");
const AttributeValueProduct = require("./product_variants.model");
const Payment = require("./payment.model");
const OrderItem = require("./order_items.model");

const Order = sequelize.define(
  "orders",
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
    address_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    payment_id:{
      type:DataTypes.INTEGER,
      allowNull:true,
      references:{
        model:'payments',
        key:'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    timestamps: false,
    underscored: true
  }
);

Order.belongsTo(userModel, {
  foreignKey: 'user_id',
  as: 'user'
});

Order.belongsTo(Payment,{
  foreignKey:'payment_id',
  as:'order_payment'
}) 

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'order_items'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order'
});




     

module.exports = Order;
