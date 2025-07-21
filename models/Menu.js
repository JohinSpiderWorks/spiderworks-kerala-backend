const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const menuModel = sequelizeConfig.define(
  "menu",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    menuName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    menuTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    menuItems: {
      type: DataTypes.JSON, // Store menu items as JSON
      allowNull: false,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
    freezeTableName: true,
    paranoid: true, // Adds `deletedAt` field for soft deletes
  }
);

module.exports = menuModel;
