const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const siteSettingsModel = sequelizeConfig.define(
  "siteSettings",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    googleTagHead: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    googleTagBody: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otherScripts: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactAddress1: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactAddress2: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleMapEmbed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facebookLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    twitterLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedinLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instagramLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    youtubeLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otherSettings: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    redirectUri: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleLoginEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    logo: {
      type: DataTypes.STRING, // Store file path or URL
      allowNull: true,
    },
    smallLogo: {
      type: DataTypes.STRING, // Store file path or URL
      allowNull: true,
    },
    favicon: {
      type: DataTypes.STRING, // Store file path or URL
      allowNull: true,
    },
    smtpHost: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpPort: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpEncryption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpFromMail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    smtpFromName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    legalName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    foundingDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    founderName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressLocality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    streetAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressRegion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addressCountry: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true, // Adds `createdAt` and `updatedAt` fields
    freezeTableName: true,
    paranoid: true, // Adds `deletedAt` field for soft deletes
  }
);

module.exports = siteSettingsModel;
