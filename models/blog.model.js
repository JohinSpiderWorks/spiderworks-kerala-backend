// const sequelizeConfig = require("../config/sequelize.config");
// const userModel = require("./user.model");

// const { DataTypes } = require("sequelize");

// const blogModel = sequelizeConfig.define(
//   "blog",
//   {
//     id: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       primaryKey: true,
//       defaultValue: DataTypes.UUIDV4,
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     short_description: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     is_published: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: "false",
//     },
//     publish_date: {
//       type: DataTypes.DATEONLY,
//       allowNull: true,
//       defaultValue: Date.now(),
//     },

//     premium: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//     meta_title: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     meta_description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     meta_keywords: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     banner_id: {
//       type: DataTypes.STRING,
//       references: {
//         model: "blogimg",
//         key: "id",
//       },
//     },
//     featured_id: {
//       type: DataTypes.STRING,
//       references: {
//         model: "blogimg",
//         key: "id",
//       },
//     },
//     og_id: {
//       type: DataTypes.STRING,
//       references: {
//         model: "blogimg",
//         key: "id",
//       },
//     },
//     author: {
//       type: DataTypes.STRING,
//       references: {
//         model: "users",
//         key: "id",
//       },
//     },
//     top_description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       defaultValue: null,
//     },
//     bottom_description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       defaultValue: null,
//     },
//     role: {
//       type: DataTypes.ENUM(
//         "user",
//         "admin",
//         "seo",
//         "author",
//         "member",
//         "editor"
//       ),
//       allowNull: false,
//       defaultValue: "user",
//     },
//     type: {
//       type: DataTypes.ENUM("banner", "featured", "standard", "none"),
//       allowNull: false,
//       defaultValue: "none",
//     },
//     slug: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     timestamps: true,
//     freezeTableName: true,
//     paranoid: true,
//   }
// );

// module.exports = blogModel;
const sequelizeConfig = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const blogModel = sequelizeConfig.define(
  "blog",
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
      validate: {
        len: {
          args: [10, 200],
          msg: "Title must be between 10 and 200 characters",
        },
      },
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contentSections: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    top_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bottom_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    publish_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    banner_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    featured_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    og_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(
        "user",
        "admin",
        "seo",
        "author",
        "member",
        "editor"
      ),
      allowNull: false,
      defaultValue: "user",
    },
    type: {
      type: DataTypes.ENUM("banner", "featured", "standard", "none"),
      allowNull: false,
      defaultValue: "none",
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
      beforeValidate: (blog) => {
        if (blog.title && !blog.slug) {
          blog.slug = blog.title
            .toLowerCase()
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "-");
        }
      },
    },
  }
);

blogModel.associate = (models) => {
  blogModel.belongsTo(models.authorModel, {
    foreignKey: "author_id",
    as: "blogAuthor",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  blogModel.belongsTo(models.userModel, {
    foreignKey: "created_by",
    as: "creator", // Changed from "createdByUser" to avoid collision
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  blogModel.belongsTo(models.blog_images, {
    foreignKey: "banner_id",
    as: "bannerImage",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  blogModel.belongsTo(models.blog_images, {
    foreignKey: "featured_id",
    as: "featuredImage",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  blogModel.belongsTo(models.blog_images, {
    foreignKey: "og_id",
    as: "ogImage",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  blogModel.hasMany(models.blog_sections, {
    foreignKey: "blog_id",
    as: "sections",
    onDelete: "CASCADE",
  });
};

module.exports = blogModel;
