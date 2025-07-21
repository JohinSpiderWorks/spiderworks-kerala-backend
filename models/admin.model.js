const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const adminModel = sequelizeConfig.define(
  "admin",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

module.exports = adminModel;
