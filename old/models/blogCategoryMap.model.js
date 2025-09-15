const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const blogCategoryMapModel = sequelizeConfig.define(
  "blog_category_map",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    blog_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "blog",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    category_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "blog_category",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM("banner", "featured", "standard", "none"),
      defaultValue: "none",
    },
  },
  {
    freezeTableName: true,
    paranoid: true,
    timestamps: true,
  }
);

module.exports = blogCategoryMapModel;
