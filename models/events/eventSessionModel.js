const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");
const Event = require("./Events"); // Import Event model

const EventSession = sequelizeConfig.define(
  "event_session",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Event, // Foreign key reference to Event table
        key: "id",
      },
      onDelete: "CASCADE", // Delete sessions if event is deleted
    },
    session_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    speaker_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    program_start_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    program_end_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true, // Soft delete support
  }
);

// Define the relationship
Event.hasMany(EventSession, { foreignKey: "event_id", onDelete: "CASCADE" });
EventSession.belongsTo(Event, { foreignKey: "event_id" });

module.exports = EventSession;
