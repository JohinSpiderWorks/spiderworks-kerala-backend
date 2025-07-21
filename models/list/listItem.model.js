// models/ListItemData.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/sequelize.config");

const ListItemData = sequelize.define(
  "listitems_data",
  {
    listId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "listitem",
        key: "id",
      },
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  }
);

module.exports = ListItemData;
