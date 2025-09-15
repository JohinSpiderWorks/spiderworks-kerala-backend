const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const menuModel = sequelizeConfig.define("menus", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('1','2','3'),
    allowNull: false,
  },
  tooltip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  link:{
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue:'/'
  },
  parent_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: "menus",
      key: "id",
    },
  },
  menu:{
    type:DataTypes.ENUM('md','mm','fd','fm'),
    allowNull:false
  },
},{
    freezeTableName:true,
    timestamps:true,
    paranoid:true
});

module.exports = menuModel;
