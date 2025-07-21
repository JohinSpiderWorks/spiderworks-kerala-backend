const { DataTypes } = require('sequelize');
const sequelizeConfig=require('../../config/sequelize.config');

const pageSectionModel=sequelizeConfig.define('pages_section',{
    id:{
        type:DataTypes.STRING,
        allowNull:false,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    heading:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    content:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    page_id:{
        type:DataTypes.STRING,
        allowNull:true,
        references:{
            model:'pages',
            key:'id'
        }
    }
},{
    freezeTableName:true,
    timestamps:true,
    paranoid:true
})

module.exports=pageSectionModel;