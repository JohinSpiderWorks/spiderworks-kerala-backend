const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const notificationModel = sequelizeConfig.define(
  "notifications",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("email", "whatsapp", "sms"),
      defaultValue: "email",
    },
    option: {
      type: DataTypes.ENUM("to", "cc", "bcc"),
      defaultValue: "to",
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: "true",
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = notificationModel;
