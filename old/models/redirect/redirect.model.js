const { DataTypes } = require("sequelize");
const sequelizeconfig = require("../../config/sequelize.config");

const redirectModel = sequelizeconfig.define(
  "redirects",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    redirect_to: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [5, 1000],
          msg: "Must be greater than 5 and less than 1000 characters",
        },
        isUrl:{
            msg:'Redirect Must be URL'
        }
      },
    },
    redirect_from: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: {
          args: [5, 1000],
          msg: "Must be greater than 5 and less than 1000 characters",
        },
        isUrl:{
            msg:'Redirect Must be URL'
        }
      },
    },
  },
  {
    freezeTableName: true,
    paranoid: true,
    timestamps: true,
  }
);


module.exports=redirectModel;