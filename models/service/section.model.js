const sequelizeConfig = require("../../config/sequelize.config");

const { DataTypes } = require("sequelize");


const serviceSectionModel = sequelizeConfig.define('servicesection',{
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      service_id:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:null,
        references:{
            model:'services',
            key:'id'
        }
      },
      section_name:{
        type:DataTypes.STRING,
        allowNull:true
      },
      heading:{
        type:DataTypes.STRING,
        allowNull:false
      },
      content:{
        type:DataTypes.TEXT('long'),
        allowNull:false
      },

},{
    freezeTableName:true,
    timestamps:true,
    paranoid:true
});


module.exports=serviceSectionModel;