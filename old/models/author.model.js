const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const authorModel = sequelizeConfig.define(
  "author",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Author name cannot be empty",
        },
      },
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Image must be a valid URL",
          args: { require_protocol: true },
        },
      },
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profession: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Instagram must be a valid URL",
        },
      },
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Facebook must be a valid URL",
        },
      },
    },
    twitter: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "Twitter must be a valid URL",
        },
      },
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "LinkedIn must be a valid URL",
        },
      },
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: "YouTube must be a valid URL",
        },
      },
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^(\+\d{1,3}[- ]?)?\d{10}$/,
          msg: "Invalid WhatsApp number format",
        },
      },
    },
    meta_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    meta_keywords: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
    hooks: {
      beforeValidate: (author) => {
        if (author.name && !author.slug) {
          author.slug = author.name
            .toLowerCase()
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "-");
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["name"],
      },
    ],
  }
);

// Association setup
authorModel.associate = (models) => {
  authorModel.hasMany(models.blogModel, {
    foreignKey: "author_id",
    as: "blogs",
    onDelete: "SET NULL",
  });
};

module.exports = authorModel;
