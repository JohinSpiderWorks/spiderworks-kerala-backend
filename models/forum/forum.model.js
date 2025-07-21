const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const forumModel = sequelizeConfig.define(
  "forums",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("not-reviewed", "approved", "on-hold", "rejected"),
      allowNull: false,
      defaultValue: "not-reviewed",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid:true
  }
);

module.exports = forumModel;
