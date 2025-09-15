const { DataTypes } = require('sequelize');
const sequelizeConfig=require('../config/sequelize.config');

const blogTopicModel=sequelizeConfig.define('topics',{
    id:{
        type:DataTypes.STRING,
        allowNull:false,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    blog_id:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue:'null'
    }
},{
    timestamps:true,
    freezeTableName:true,
    paranoid:true
});

module.exports=blogTopicModel;