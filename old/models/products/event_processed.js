const sequelize = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const Order = require("./order.model");

const EventProcessed = sequelize.define(
  "event_processed",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    event_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
  },
  {
    timestamps: true,
    underscored: true
  }
);



module.exports = EventProcessed;

