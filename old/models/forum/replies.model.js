const sequelizeConfig = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");
const forumReplyModel = sequelizeConfig.define(
  "replies",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    reply: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    forum_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "forums",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "user",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid:true
  }
);


module.exports=forumReplyModel;