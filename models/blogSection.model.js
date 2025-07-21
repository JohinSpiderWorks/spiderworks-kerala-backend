const sequelizeConfig = require("../config/sequelize.config");

const { DataTypes } = require("sequelize");


const blogSectionModel = sequelizeConfig.define('blogsection',{
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      blog_id:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:null,
        references:{
            model:'blog',
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


module.exports=blogSectionModel;