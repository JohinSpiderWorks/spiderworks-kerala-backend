const sequelizeConfig = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const Order = require("./order");

const Payment = sequelizeConfig.define(
  "payments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    payment_method: {
      type: DataTypes.ENUM('card', 'wallet', 'net_banking', 'upi', 'bank_transfer'),
      defaultValue:'card',
      allowNull: false,
   
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'INR',
    
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    underscored: true,
    hooks: {
      beforeSave: (payment) => {
        payment.updated_at = new Date();
      },
    },
  }
);

module.exports = Payment;


