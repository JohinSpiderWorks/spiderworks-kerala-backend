const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");
const userModel = require("./user.model");
const blogModel = require("./blog.model");

const blogSaveModel = sequelizeConfig.define(
  "save",
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
        model: userModel,
        key: "id",
      },
    },
    blog_id: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
      references: {
        model: blogModel,
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

module.exports = blogSaveModel;
