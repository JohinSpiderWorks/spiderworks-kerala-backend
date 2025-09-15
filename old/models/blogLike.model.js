const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const blogLikeModel = sequelizeConfig.define(
  "comment_like",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
      references: {
        model: "user",
        key: "id",
      },
    },
    comment_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
      references: {
        model: "comments",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid:true
  }
);

module.exports = blogLikeModel;
