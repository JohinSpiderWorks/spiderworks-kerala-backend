const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const blogCommentModel = sequelizeConfig.define(
  "comments",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "users",
        key: "id",
      },
    },
    blog_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "blog",
        key: "id",
      },
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = blogCommentModel;
