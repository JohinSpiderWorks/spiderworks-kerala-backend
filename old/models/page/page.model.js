const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const pageModel = sequelizeConfig.define(
  "pages",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    page_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [3, 15],
          msg: "Title Must be Between 3 and 15 characters",
        },
      },
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [10, 1000],
          msg: "Description Must be Between 10 and 1000 characters",
        },
      },
    },
    top_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // ✅ correct type
    },
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_keywords: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_dynamic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // ✅
    },
    slug: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true
},
og_title: {
  type: DataTypes.STRING,
  allowNull: true
},
og_description: {
  type: DataTypes.TEXT,
  allowNull: true
},
og_image: {
  type: DataTypes.STRING, // or DataTypes.TEXT if storing URLs
  allowNull: true
}
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = pageModel;
