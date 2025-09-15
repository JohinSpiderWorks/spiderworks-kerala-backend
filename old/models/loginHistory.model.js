const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const loginHistoryModel = sequelizeConfig.define(
  "login_history",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("success", "failed"),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true, // Enable Sequelize timestamps
    createdAt: "created_at", // Map createdAt to created_at column
    updatedAt: "updated_at", // Map updatedAt to updated_at column
    freezeTableName: true, // Prevent pluralization
    underscored: true, // Use snake_case for automatic field mapping
  }
);
module.exports = loginHistoryModel;
