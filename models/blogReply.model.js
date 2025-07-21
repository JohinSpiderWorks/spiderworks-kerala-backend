const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const blogReplyModel = sequelizeConfig.define(
  "comment_reply",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    reply: {
      type: DataTypes.TEXT,
      allowNull: false,
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

module.exports = blogReplyModel;
