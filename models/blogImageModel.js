const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust path to your database config

const BlogImage = sequelize.define("BlogImage", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  blog_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Blogs",
      key: "id",
    },
  },
  image_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "BannerImages",
      key: "id",
    },
  },
});

module.exports = BlogImage;
