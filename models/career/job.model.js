const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const jobModel = sequelizeConfig.define(
  "jobs",
  {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    responsibilities: {
      type: DataTypes.TEXT,
    },
    last_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "null",
    },
    requirements: {
      type: DataTypes.TEXT,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: "false",
    },
    deleted_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: "true",
    },
    company_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "null",
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = jobModel;
