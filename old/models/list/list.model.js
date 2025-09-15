const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const ListItem = sequelizeConfig.define(
  "listitem",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fields: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  }
);

module.exports = ListItem;
