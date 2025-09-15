const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const blogFavouriteModel = sequelizeConfig.define(
  "favourite",
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
    blog_id: {
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

module.exports = blogFavouriteModel;
