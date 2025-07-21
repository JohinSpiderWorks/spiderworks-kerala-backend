const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const applicantModel = sequelizeConfig.define(
  "applicants",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resume: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    job_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "jobs",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  }
);

module.exports = applicantModel;
