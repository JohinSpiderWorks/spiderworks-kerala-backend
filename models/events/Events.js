const sequelizeConfig = require("../../config/sequelize.config");
const { DataTypes } = require("sequelize");

const eventModel = sequelizeConfig.define(
  "event",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event_type: {
      type: DataTypes.ENUM('Standard', 'Custom_html', 'External_link'),
      allowNull: false,
    },
    event_format : {
      type: DataTypes.ENUM('Workshop', 'CTF', 'Workshop_CTF'),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    event_venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    why_participate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_free : {
      type: DataTypes.ENUM('Free', 'Paid'),
      allowNull: false,
    },
    max_ticket_count: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ticket_cost: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ctf_sub_domain : {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ctf_api_key : {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ctf_format  : {
      type: DataTypes.ENUM('Team', 'Solo'),
      allowNull: false,
    },
    ctf_team_size   : {
      type: DataTypes.NUMBER,
      allowNull: false,
    },


    event_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    event_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    content_type: {
      type: DataTypes.ENUM("Sections", "Full Body HTML"),
      allowNull: true,
    },
   
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    top_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    full_body_html: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    faq_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
    freezeTableName: true,
    paranoid: true, // Adds `deletedAt` field for soft deletes
  }
);

module.exports = eventModel;
