const { DataTypes, Sequelize } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");
const userModel = require("../models/user.model");
const Product = require("../models/product.model");
const GalleryFolder = require("../models/GalleryFolder");
const GalleryMedia = require("../models/GalleryMedia");
const bcrypt = require("bcrypt");
const sequelize = require("../config/sequelize.config");

const queryInterface = sequelizeConfig.getQueryInterface();

const createAdminUser = async () => {
  try {
    await sequelizeConfig.sync(); // Ensure the database schema is up to date

    const existingAdmin = await userModel.findOne({
      where: { email: "tony@spiderworks.in" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash("Secret@123", 10);

    await userModel.create({
      name: "Tony John",
      email: "tony@spiderworks.in",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created successfully.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await sequelizeConfig.close(); // Close the DB connection
  }
};

const runGalleryMigrations = async () => {
  try {
    // Sync the database to ensure the connection is active
    await sequelizeConfig.authenticate();
    console.log("Database connection established.");

    // Step 1: Create gallery_folders table if it doesn't exist
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("gallery_folders")) {
      await queryInterface.createTable(
        "gallery_folders",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          tableName: "gallery_folders",
          timestamps: false,
        }
      );
      console.log("Successfully created gallery_folders table.");
    } else {
      console.log("gallery_folders table already exists.");
    }

    // Step 2: Update gallery_media table by adding folder_id column
    const tableDescription = await queryInterface.describeTable(
      "gallery_media"
    );
    if (!tableDescription.folder_id) {
      await queryInterface.addColumn("gallery_media", "folder_id", {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: "gallery_folders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log(
        "Successfully added folder_id column to gallery_media table."
      );
    } else {
      console.log("folder_id column already exists in gallery_media table.");
    }

    console.log("Gallery migrations completed successfully.");
  } catch (error) {
    console.error("Error running gallery migrations:", error);
  } finally {
    // Close the connection only after all migrations are complete
    await sequelizeConfig.close();
    console.log("Database connection closed.");
  }
};

//runGalleryMigrations();

const runBlogMigrations = async () => {
  const queryInterface = sequelizeConfig.getQueryInterface();

  try {
    // Step 1: Test database connection
    console.log("Testing database connection...");
    await sequelizeConfig.authenticate();
    console.log("Database connection established for blog migrations.");

    // Step 2: Check if blog table exists, create if it doesn't
    const tables = await queryInterface.showAllTables();
    console.log("Existing tables:", tables);
    if (!tables.includes("blog")) {
      await queryInterface.createTable(
        "blog",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          short_description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          sections: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
          },
          top_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
          },
          bottom_description: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
          },
          is_published: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          publish_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: null,
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
            references: {
              model: "blogimg",
              key: "id",
            },
          },
          featured_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: "blogimg",
              key: "id",
            },
          },
          og_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: "blogimg",
              key: "id",
            },
          },
          author_id: {
            type: DataTypes.STRING,
            allowNull: true,
            references: {
              model: "authors",
              key: "id",
            },
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
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        },
        {
          tableName: "blog",
          timestamps: true,
          freezeTableName: true,
          paranoid: true,
        }
      );
      console.log("Successfully created blog table.");
    } else {
      console.log("blog table already exists.");

      // Step 3: Check and remove description column if it exists
      const tableDescription = await queryInterface.describeTable("blog");
      console.log("Current blog table schema:", tableDescription);
      if (tableDescription.description) {
        await queryInterface.removeColumn("blog", "description");
        console.log("Successfully removed description column from blog table.");
      } else {
        console.log("description column does not exist in blog table.");
      }

      // Step 4: Check and add sections column if it doesn't exist
      if (!tableDescription.sections) {
        await queryInterface.addColumn("blog", "sections", {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: [],
        });
        console.log("Successfully added sections column to blog table.");
      } else {
        console.log("sections column already exists in blog table.");
      }

      // Step 5: Check and update publish_date column
      if (
        tableDescription.publish_date &&
        tableDescription.publish_date.defaultValue !== null
      ) {
        await queryInterface.changeColumn("blog", "publish_date", {
          type: DataTypes.DATEONLY,
          allowNull: true,
          defaultValue: null,
        });
        console.log("Successfully updated publish_date column in blog table.");
      } else {
        console.log(
          "publish_date column is already correctly configured or does not exist."
        );
      }

      // Step 6: Check and update author column (rename to author_id and update reference)
      if (tableDescription.author) {
        await queryInterface.removeColumn("blog", "author");
        console.log("Successfully removed author column from blog table.");

        await queryInterface.addColumn("blog", "author_id", {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: "authors",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        console.log("Successfully added author_id column to blog table.");
      } else if (!tableDescription.author_id) {
        await queryInterface.addColumn("blog", "author_id", {
          type: DataTypes.STRING,
          allowNull: true,
          references: {
            model: "authors",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        });
        console.log("Successfully added author_id column to blog table.");
      } else {
        console.log("author_id column already exists in blog table.");
      }

      // Step 7: Ensure ENUM fields are correctly set
      if (!tableDescription.role) {
        await queryInterface.addColumn("blog", "role", {
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
        });
        console.log("Successfully added role column to blog table.");
      }

      if (!tableDescription.type) {
        await queryInterface.addColumn("blog", "type", {
          type: DataTypes.ENUM("banner", "featured", "standard", "none"),
          allowNull: false,
          defaultValue: "none",
        });
        console.log("Successfully added type column to blog table.");
      }
    }

    console.log("Blog migrations completed successfully.");
  } catch (error) {
    console.error("Error running blog migrations:", error);
    throw error;
  } finally {
    await sequelizeConfig.close();
    console.log("Database connection closed.");
  }
};

runBlogMigrations();

//createAdminUser();

// const migrateDatabase = async () => {
//   try {
//     console.log("Starting database migration...");

//     await sequelizeConfig.getQueryInterface().createTable("products", {
//       id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       status: {
//         type: DataTypes.ENUM("active", "inactive"),
//         allowNull: false,
//         defaultValue: "active",
//       },
//       primary_category_id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       created_by: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       created_date: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
//       },
//     });

//     await sequelizeConfig
//       .getQueryInterface()
//       .createTable("product_categories", {
//         id: {
//           type: DataTypes.STRING,
//           allowNull: false,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         name: {
//           type: DataTypes.STRING,
//           allowNull: false,
//         },
//         status: {
//           type: DataTypes.ENUM("active", "inactive"),
//           allowNull: false,
//           defaultValue: "active",
//         },
//         created_by: {
//           type: DataTypes.STRING,
//           allowNull: false,
//         },
//         created_date: {
//           type: DataTypes.DATE,
//           allowNull: false,
//           defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
//         },
//       });

//     await sequelizeConfig
//       .getQueryInterface()
//       .createTable("product_category_mapping", {
//         id: {
//           type: DataTypes.STRING,
//           allowNull: false,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         product_id: {
//           type: DataTypes.STRING,
//           allowNull: false,
//         },
//         category_id: {
//           type: DataTypes.STRING,
//           allowNull: false,
//         },
//       });

//     await sequelizeConfig.getQueryInterface().createTable("product_variants", {
//       id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       product_id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       title: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       description: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       specification: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       default_price: {
//         type: DataTypes.FLOAT,
//         allowNull: false,
//       },
//       status: {
//         type: DataTypes.ENUM("active", "inactive"),
//         allowNull: false,
//         defaultValue: "active",
//       },
//       created_by: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       created_date: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
//       },
//     });

//     await sequelizeConfig.getQueryInterface().createTable("products_media", {
//       id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: DataTypes.UUIDV4,
//         primaryKey: true,
//       },
//       product_id: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       media_name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       filename: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       file_type: {
//         type: DataTypes.ENUM("Image", "Video", "Document"),
//         allowNull: false,
//       },
//       status: {
//         type: DataTypes.ENUM("active", "inactive"),
//         allowNull: false,
//         defaultValue: "active",
//       },
//       created_by: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       created_date: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
//       },
//     });

//     console.log("Database migration completed successfully.");
//   } catch (error) {
//     console.error("Error during migration:", error);
//   }
// };

const migrateDatabase = async () => {
  try {
    console.log("Starting database migration...");

    // Create tables using QueryInterface
    await sequelizeConfig.getQueryInterface().createTable("products", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      primary_category_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await sequelizeConfig
      .getQueryInterface()
      .createTable("product_categories", {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM("active", "inactive"),
          allowNull: false,
          defaultValue: "active",
        },
        created_by: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        created_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

    await sequelizeConfig
      .getQueryInterface()
      .createTable("product_category_mapping", {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        category_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      });

    await sequelizeConfig.getQueryInterface().createTable("product_variants", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      specification: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      default_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await sequelizeConfig.getQueryInterface().createTable("products_media", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      media_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.ENUM("Image", "Video", "Document"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    console.log("Database migration completed successfully.");

    // After migrations are complete, define the models and associations
    const defineModelsAndAssociations = () => {
      // Define models
      const Product = sequelizeConfig.define(
        "Product",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
          },
          primary_category_id: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          tableName: "products",
          timestamps: false,
        }
      );

      const ProductCategory = sequelizeConfig.define(
        "ProductCategory",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          tableName: "product_categories",
          timestamps: false,
        }
      );

      const ProductCategoryMapping = sequelizeConfig.define(
        "ProductCategoryMapping",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          product_id: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          category_id: {
            type: DataTypes.STRING,
            allowNull: false,
          },
        },
        {
          tableName: "product_category_mapping",
          timestamps: false,
        }
      );

      const ProductVariant = sequelizeConfig.define(
        "ProductVariant",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          product_id: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          title: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          specification: {
            type: DataTypes.TEXT,
            allowNull: true,
          },
          default_price: {
            type: DataTypes.FLOAT,
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          tableName: "product_variants",
          timestamps: false,
        }
      );

      const ProductMedia = sequelizeConfig.define(
        "ProductMedia",
        {
          id: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
          },
          product_id: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          media_name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          filename: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          file_type: {
            type: DataTypes.ENUM("Image", "Video", "Document"),
            allowNull: false,
          },
          status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
          },
          created_by: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          created_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        {
          tableName: "products_media",
          timestamps: false,
        }
      );

      // Define associations
      Product.hasMany(ProductVariant, {
        foreignKey: "product_id",
        sourceKey: "id",
        as: "variants",
      });
      ProductVariant.belongsTo(Product, {
        foreignKey: "product_id",
        targetKey: "id",
      });

      Product.hasMany(ProductMedia, {
        foreignKey: "product_id",
        sourceKey: "id",
        as: "media",
      });
      ProductMedia.belongsTo(Product, {
        foreignKey: "product_id",
        targetKey: "id",
      });

      // Primary category association
      Product.belongsTo(ProductCategory, {
        foreignKey: "primary_category_id",
        targetKey: "id",
        as: "primaryCategory",
      });
      ProductCategory.hasMany(Product, {
        foreignKey: "primary_category_id",
        sourceKey: "id",
      });

      // Many-to-many association for additional categories
      Product.belongsToMany(ProductCategory, {
        through: ProductCategoryMapping,
        foreignKey: "product_id",
        otherKey: "category_id",
        as: "categories",
      });
      ProductCategory.belongsToMany(Product, {
        through: ProductCategoryMapping,
        foreignKey: "category_id",
        otherKey: "product_id",
        as: "products",
      });

      return {
        Product,
        ProductCategory,
        ProductCategoryMapping,
        ProductVariant,
        ProductMedia,
      };
    };

    // Return the models and associations
    return defineModelsAndAssociations();
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
};

//migrateDatabase();

const migrateGalleryMediaTable = async () => {
  try {
    console.log("Starting migration for gallery_media table...");

    // Create the gallery_media table
    await sequelizeConfig.getQueryInterface().createTable("gallery_media", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      media_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      file_type: {
        type: DataTypes.ENUM("Image", "Video", "Document"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    console.log("gallery_media table created successfully.");
  } catch (error) {
    console.error("Error during gallery_media table migration:", error);
    throw error;
  }
};

//migrateGalleryMediaTable();

const migrateUserRoleEnum = async () => {
  try {
    console.log("Starting user role enum migration...");

    // Drop the existing enum type if it exists
    await sequelizeConfig.query(
      'DROP TYPE IF EXISTS "enum_users_role" CASCADE;'
    );

    // Create the new enum type
    await sequelizeConfig.query(
      "CREATE TYPE \"enum_users_role\" AS ENUM ('user', 'admin', 'seo', 'author', 'member', 'editor');"
    );

    // Alter the column to use the new enum type
    await sequelizeConfig.query(
      'ALTER TABLE "users" ALTER COLUMN "role" TYPE "enum_users_role" USING (role::text::"enum_users_role");'
    );

    console.log("Successfully migrated user role enum type.");
  } catch (error) {
    console.error("Error during user role enum migration:", error);
    throw error;
  }
};

//migrateUserRoleEnum();

const migrateEventTableV2 = async () => {
  try {
    console.log("Starting migration for event table...");

    await sequelizeConfig.getQueryInterface().createTable("event", {
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
        type: DataTypes.ENUM("Standard", "Custom_html", "External_link"),
        allowNull: false,
      },
      event_format: {
        type: DataTypes.ENUM("Workshop", "CTF", "Workshop_CTF"),
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      event_venue: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      why_participate: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_free: {
        type: DataTypes.ENUM("Free", "Paid"),
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
      ctf_sub_domain: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ctf_api_key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ctf_format: {
        type: DataTypes.ENUM("Team", "Solo"),
        allowNull: false,
      },
      ctf_team_size: {
        type: DataTypes.INTEGER,
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
      og_title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      og_description: {
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    console.log("event table created successfully.");
  } catch (error) {
    console.error("Error during event table migration:", error);
    throw error;
  }
};

migrateEventTableV2();

const migrateMenuTable = async () => {
  try {
    console.log("Starting migration for menu table...");

    // Create the menu table
    await sequelizeConfig.getQueryInterface().createTable("menu", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      menuName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      menuTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      menuItems: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    console.log("menu table created successfully.");
  } catch (error) {
    console.error("Error during menu table migration:", error);
    throw error;
  }
};

//migrateMenuTable();

const migrateTestimonialsTable = async () => {
  try {
    console.log("Starting migration for testimonials table...");

    // Create the testimonials table
    await sequelizeConfig.getQueryInterface().createTable("testimonials", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      author_photo: {
        type: DataTypes.STRING,
        allowNull: true, // Optional field
      },
      type: {
        type: DataTypes.ENUM(
          "text",
          "image",
          "video_embed",
          "video_attachment"
        ),
        allowNull: true, // Optional field
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true, // Optional field
      },
      video_url: {
        type: DataTypes.STRING,
        allowNull: true, // Optional field
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true, // Optional field for soft deletes
      },
    });

    console.log("testimonials table created successfully.");
  } catch (error) {
    console.error("Error during testimonials table migration:", error);
    throw error;
  }
};

//migrateTestimonialsTable();

const migrateSiteSettingsTable = async () => {
  try {
    console.log("Starting migration for siteSettings table...");

    const queryInterface = sequelizeConfig.getQueryInterface();

    // Add new columns
    await queryInterface.addColumn("siteSettings", "companyName", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "legalName", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "url", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "foundingDate", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "founderName", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "addressLocality", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "postalCode", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "streetAddress", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "addressRegion", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "addressCountry", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("siteSettings", "countryCode", {
      type: DataTypes.STRING,
      allowNull: true,
    });

    console.log("siteSettings table updated successfully.");
  } catch (error) {
    console.error("Error during siteSettings table migration:", error);
    throw error;
  }
};

//migrateSiteSettingsTable();

const migrateSocialMediaPlatformTable = async () => {
  try {
    console.log("Starting migration for social_media_platform table...");

    const queryInterface = sequelizeConfig.getQueryInterface();

    await queryInterface.createTable("social_media_platform", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    console.log("social_media_platform table created successfully.");
  } catch (error) {
    console.error("Error during social_media_platform table migration:", error);
    throw error;
  }
};

//migrateSocialMediaPlatformTable();

const migrateSocialMediaLinksTable = async () => {
  try {
    console.log("Starting migration for social_media_links table...");

    const queryInterface = sequelizeConfig.getQueryInterface();

    await queryInterface.createTable("social_media_links", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      socialMediaPlatformId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "social_media_platforms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      logoPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    // Add unique constraint for url per social media platform
    await queryInterface.addConstraint("social_media_links", {
      type: "unique",
      fields: ["url", "socialMediaPlatformId"],
      name: "unique_url_per_platform",
    });

    console.log("social_media_links table created successfully.");
  } catch (error) {
    console.error("Error during social_media_links table migration:", error);
    throw error;
  }
};

//migrateSocialMediaLinksTable();

const migrateEventTable = async () => {
  try {
    console.log("Starting migration for events table...");

    await sequelizeConfig.getQueryInterface().createTable("events", {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
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
        allowNull: false,
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
        type: DataTypes.STRING,
        allowNull: true,
      },
      faq_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    console.log("events table created successfully.");
  } catch (error) {
    console.error("Error during events table migration:", error);
    throw error;
  }
};

//migrateEventTable();

const migrateEventSessionTable = async () => {
  try {
    console.log("Starting migration for event_sessions table...");

    await sequelizeConfig.getQueryInterface().createTable("event_sessions", {
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
          model: "events", // References the `events` table
          key: "id",
        },
        onDelete: "CASCADE", // Deletes sessions if the event is deleted
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
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    });

    console.log("event_sessions table created successfully.");
  } catch (error) {
    console.error("Error during event_sessions table migration:", error);
    throw error;
  }
};

//migrateEventSessionTable();

// Function to add OTP fields to users table
const addOtpFieldsToUsers = async () => {
  await queryInterface.addColumn("users", "otp", {
    type: DataTypes.STRING,
    allowNull: true, // OTP can be null initially
  });

  await queryInterface.addColumn("users", "otp_expires", {
    type: DataTypes.DATE, // Stores expiration timestamp
    allowNull: true, // Can be null initially
  });

  console.log("OTP fields added successfully to users table");
};

//addOtpFieldsToUsers();

const updateJobsDeletedByForeignKey = async (queryInterface) => {
  try {
    // Remove the old foreign key constraint
    await queryInterface.removeConstraint("jobs", "jobs_deleted_by_fkey");

    // Add the new foreign key constraint referencing the correct table
    await queryInterface.addConstraint("jobs", {
      fields: ["deleted_by"],
      type: "foreign key",
      name: "jobs_deleted_by_fkey", // Ensure the constraint name is correct
      references: {
        table: "users", // The correct table name
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    console.log("Foreign key constraint updated successfully in jobs table.");
  } catch (error) {
    console.error("Error updating foreign key constraint:", error);
  }
};

// Example usage
//updateJobsDeletedByForeignKey(queryInterface);

const updateCommentsTableReferences = async (queryInterface) => {
  try {
    // Remove the existing foreign key constraint (if applicable)
    await queryInterface.removeColumn("comments", "user_id");

    // Add the new column with the correct reference
    await queryInterface.addColumn("comments", "user_id", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      references: {
        model: "users", // Updated reference
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    console.log("Successfully updated user_id reference in comments table");
  } catch (error) {
    console.error("Error updating user_id reference in comments table:", error);
  }
};

//updateCommentsTableReferences(queryInterface);

const updateNotificationForeignKey = async () => {
  const queryInterface = sequelizeConfig.getQueryInterface();

  try {
    console.log(
      "Updating foreign key reference for 'created_by' in 'notifications'..."
    );

    // Step 1: Remove the existing foreign key constraint
    await queryInterface.removeConstraint(
      "notifications",
      "notifications_created_by_fkey"
    );

    // Step 2: Add the new foreign key reference to "users"
    await queryInterface.addConstraint("notifications", {
      fields: ["created_by"],
      type: "foreign key",
      name: "notifications_created_by_fkey", // Unique constraint name
      references: {
        table: "users", // Updated reference to "users"
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    console.log("Foreign key reference for 'created_by' updated successfully.");
  } catch (error) {
    console.error("Error updating foreign key reference:", error);
  }
};

// Call the function to apply the migration
//updateNotificationForeignKey();

// menu module migration

const menuAddColumn = async () => {
  await queryInterface.addConstraint("menus", {
    fields: ["parent_id"],
    type: "foreign key",
    name: "menus_parent_id_fkey",
    references: {
      table: "menus",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  // await queryInterface.addColumn('menus','link',{
  //   type:DataTypes.STRING,
  //   allowNull:true,
  //   defaultValue:'/'
  // })
  await queryInterface.addColumn("menus", "parent_id", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "null",
  });
};

const Menudown = async () => {
  await queryInterface.removeConstraint("menus", "menus_parent_id_fkey");
  await queryInterface.removeColumn("menus", "parent_id");
};

const jobaddColumn = async () => {
  await queryInterface.addConstraint("jobs", {
    fields: ["deleted_by"],
    type: "foreign key",
    name: "jobs_deleted_by_fkey",
    references: {
      table: "jobs",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  // await queryInterface.addColumn('jobs','link',{
  //   type:DataTypes.STRING,
  //   allowNull:true,
  //   defaultValue:'/'
  // })
  await queryInterface.addColumn("jobs", "deleted_by", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "null",
  });
};

const jobdown = async () => {
  await queryInterface.removeConstraint("jobs", "jobs_deleted_by_fkey");
  await queryInterface.removeColumn("jobs", "deleted_by");
};

// Menudown()
// menuAddColumn();
// jobdown();
// jobaddColumn();

// new migration

// const addNewColumn=async()=>{
//   await queryInterface.addColumn('user','user_id',{
//     type:DataTypes.STRING,
//     allowNull:true,
//     defaultValue:'null'
//   })

//   await queryInterface.addColumn('bannerimg','blog_id',{
//     type:DataTypes.STRING,
//     allowNull:true,
//     defaultValue:'null'
//   })

//   await queryInterface.addColumn('bannerimg','image_type',{
//     type:DataTypes.ENUM('banner','thumbanil','featured','attachment','og'),
//     allowNull:true,
//     defaultValue:'banner'
//   })

// }

// addNewColumn();

//add new column in user model

const addNewColumn = async () => {
  await queryInterface.addColumn("user", "password_expired", {
    type: DataTypes.BOOLEAN,
    defaultValue: "true",
  });
  await queryInterface.addColumn("comments", "status", {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  });
};

// addNewColumn()

// add new column to the forums

const addNewForumColumn = async () => {
  await queryInterface.addColumn("forums", "status", {
    type: DataTypes.ENUM("not-reviewed", "approved", "on-hold", "rejected"),
    allowNull: false,
    defaultValue: "not-reviewed",
  });
};

// addNewForumColumn();

const addNewBlogColumn = async () => {
  await queryInterface.addColumn("blog", "type", {
    type: DataTypes.ENUM("banner", "featured", "standard", "none"),
    allowNull: false,
    defaultValue: "none",
  });
};

const addNewPageColumn = async () => {
  await queryInterface.addColumn("pages", "meta_title", {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "sample Title",
  });
  await queryInterface.addColumn("pages", "meta_description", {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "sample Description",
  });
};

// addNewPageColumn();
// addNewBlogColumn();

const addNewPagesColumn = async () => {
  // await queryInterface.addColumn('pages','is_dynamic',{
  //   type:DataTypes.BOOLEAN,
  //   allowNull:false,
  //   defaultValue:'true'
  // })
  await queryInterface.addColumn("pages", "page_name", {
    type: DataTypes.STRING,
    defaultValue: "static pages",
  });
};

// addNewPagesColumn();

const addNewCategoryColumn = async () => {
  await queryInterface.addColumn("blog_category", "status", {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  });
};

// addNewCategoryColumn()

const updateBlogCategoryConstraint = async () => {
  await queryInterface.removeConstraint(
    "blog_category_map",
    "blog_category_map_category_id_fkey"
  );
  await queryInterface.removeConstraint(
    "blog_category_map",
    "blog_category_map_blog_id_fkey"
  );
  await queryInterface.addConstraint("blog_category_map", {
    fields: ["category_id"],
    type: "foreign key",
    name: "blog_category_map_category_id_fkey",
    references: {
      table: "blog_category",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    // deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED,
  });
  await queryInterface.addConstraint("blog_category_map", {
    fields: ["blog_id"],
    type: "foreign key",
    name: "blog_category_map_blog_id_fkey",
    references: {
      table: "blog",
      field: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    // deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED,
  });
};

// updateBlogCategoryConstraint()

const addNewColumnToBlog = async () => {
  await queryInterface.addColumn("blog", "slug", {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

// addNewColumnToBlog();

const changeTableName = async () => {
  await queryInterface.renameTable("bannerimg", "blogimg");
  console.log("Rename Table Successfully");
};

const removeConstraints = async () => {
  await queryInterface.removeConstraint("blog", "blog_banner_id_fkey");
  await queryInterface.addConstraint("blog", "blog_banner_id_fkey");
  console.log("Remove Constraint Successfully");
};

const addSoftDelete = async () => {
  // await queryInterface.addColumn('blog','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })

  // await queryInterface.addColumn('blogimg','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('comments','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('forums','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('pages','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('user','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('jobs','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })
  // await queryInterface.addColumn('menus','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })

  // await queryInterface.addColumn('favourite','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })

  // await queryInterface.addColumn('replies','deletedAt',{
  //   type:DataTypes.DATE,
  //   allowNull:true
  // })

  console.log("migration done");
};

//brand migration
const addNewBrandColumn = async () => {
  await queryInterface.addColumn("brands", "short_description", {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  });

  await queryInterface.addColumn("brands", "featured", {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });
};

//gallery media migration
const addNewGalleryMediaColumn = async () => {
  await queryInterface.addColumn("gallery_media", "src", {
    type: DataTypes.STRING,
  });
};

// category migration

const categoryMigration = async () => {
  await queryInterface.changeColumn("Product_Categories", "og_image", {
    type: DataTypes.UUID,
    allowNull: true,
  });
};

//category items
const categoryItemMigration = async () => {
  await queryInterface.changeColumn("category_items", "category_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.changeColumn("category_items", "created_by", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.changeColumn("category_items", "updated_by", {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

// PRODUCT SECTION

const productMigration = async () => {
  try {
    // await queryInterface.removeColumn('products', 'name');
    // await queryInterface.removeColumn('products', 'primary_category_id');

    // await queryInterface.addColumn('products', 'featured_image_id', {
    //   type: DataTypes.STRING
    // });

    // await queryInterface.addColumn('products', 'banner_image_id', {
    //   type: DataTypes.STRING
    // });

    // await queryInterface.addColumn('products', 'brand_id', {
    //   type: DataTypes.BIGINT
    // });

    // await queryInterface.addColumn('products','title',{
    //   type:DataTypes.STRING
    // })

    // await queryInterface.addColumn('products','slug',{
    //   type:DataTypes.STRING
    // })

    // await queryInterface.addColumn('products','description',{
    //   type:DataTypes.TEXT
    // })
    // await queryInterface.addColumn('products','short_description',{
    //   type:DataTypes.TEXT
    // })
    // await queryInterface.addColumn('products','meta_title',{
    //   type:DataTypes.STRING
    // })
    // await queryInterface.addColumn('products','info',{
    //   type:DataTypes.TEXT
    // })

    // await queryInterface.addColumn('products','category_id_1',{
    //   type:DataTypes.STRING
    // })
    // await queryInterface.addColumn('products','category_id_2',{
    //   type:DataTypes.STRING
    // })
    // await queryInterface.addColumn('products','category_id_3',{
    //   type:DataTypes.STRING
    // })

    // await queryInterface.addColumn('products', 'meta_description', {
    //   type: DataTypes.TEXT
    // });

    // await queryInterface.addColumn('products', 'meta_keywords', {
    //   type: DataTypes.TEXT
    // });

    // await queryInterface.addColumn('products', 'og_title', {
    //   type: DataTypes.STRING
    // });

    // await queryInterface.addColumn('products', 'og_description', {
    //   type: DataTypes.TEXT
    // });

    // await queryInterface.addColumn('products', 'og_image_id', {
    //   type: DataTypes.BIGINT
    // });

    // await queryInterface.addColumn('products', 'bottom_description', {
    //   type: DataTypes.TEXT
    // });

    // await queryInterface.addColumn('products', 'is_featured', {
    //   type: DataTypes.BOOLEAN
    // });

    // await queryInterface.addColumn('products', 'is_product', {
    //   type: DataTypes.BOOLEAN
    // });

    // await queryInterface.addColumn('products', 'created_by', {
    //   type: DataTypes.BIGINT
    // });

    // await queryInterface.addColumn('products', 'updated_by', {
    //   type: DataTypes.BIGINT
    // });

    // await queryInterface.addColumn('products','createdAt',{
    //   type:DataTypes.DATE
    // })
    // await queryInterface.addColumn('products','updatedAt',{
    //   type:DataTypes.DATE
    // })

    await queryInterface.addConstraint("products", {
      fields: ["category_id_1"],
      type: "foreign key",
      name: "products_category_id_1_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("products", {
      fields: ["category_id_2"],
      type: "foreign key",
      name: "products_category_id_2_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("products", {
      fields: ["category_id_3"],
      type: "foreign key",
      name: "products_category_id_3_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    // await queryInterface.changeColumn('products','og_image_id',{
    //   type:DataTypes.STRING
    // })

    console.log("Successfully added all columns to products table");
  } catch (error) {
    console.error("Error during product migration:", error.message);
  }
};

// product category association

const productCategory = async () => {
  try {
    // First remove existing foreign key constraints
    try {
      await queryInterface.removeConstraint(
        "products",
        "products_category_id_1_fk"
      );
    } catch (error) {
      // Ignore if constraint doesn't exist
    }
    try {
      await queryInterface.removeConstraint(
        "products",
        "products_category_id_2_fk"
      );
    } catch (error) {
      // Ignore if constraint doesn't exist
    }
    try {
      await queryInterface.removeConstraint(
        "products",
        "products_category_id_3_fk"
      );
    } catch (error) {
      // Ignore if constraint doesn't exist
    }

    // Change column types using USING clause for explicit casting
    await queryInterface.sequelize.query(`
      ALTER TABLE products 
      ALTER COLUMN category_id_1 TYPE UUID USING category_id_1::uuid
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE products 
      ALTER COLUMN category_id_2 TYPE UUID USING category_id_2::uuid
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE products 
      ALTER COLUMN category_id_3 TYPE UUID USING category_id_3::uuid
    `);
    await queryInterface.addConstraint("products", {
      fields: ["category_id_1"],
      type: "foreign key",
      name: "products_category_id_1_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("products", {
      fields: ["category_id_2"],
      type: "foreign key",
      name: "products_category_id_2_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("products", {
      fields: ["category_id_3"],
      type: "foreign key",
      name: "products_category_id_3_fk",
      references: {
        table: "product_category",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    console.log("Successfully added product category constraints");
  } catch (error) {
    console.error("Error during product category migration:", error.message);
  }
};

// product variants migration

async function productVariant(params) {
  // await queryInterface.changeColumn('product_variants','createdAt',{
  //   type:DataTypes.DATE,
  //   defaultValue:DataTypes.NOW
  // })

  // await queryInterface.sequelize.query(`
  //   UPDATE product_variants
  //   SET createdAt = NOW()
  //   WHERE createdAt IS NULL
  // `);

  // Update null values in src column to empty string
  await queryInterface.sequelize.query(`
  UPDATE gallery_media
  SET src = ''
  WHERE src IS NULL
`);

  // Add not null constraint to src column
  await queryInterface.changeColumn("gallery_media", "src", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

// category items migration

const productcategoryitems = async () => {
  // First create a new temporary column
  // await queryInterface.addColumn('category_items', 'temp_category_id', {
  //   type: DataTypes.UUID
  // });

  // // Copy and convert data from old column to new column
  // await queryInterface.sequelize.query(`
  //   UPDATE category_items
  //   SET temp_category_id = CAST(category_id AS UUID)
  //   WHERE category_id IS NOT NULL
  // `);

  // // Remove the old column
  // await queryInterface.removeColumn('category_items', 'category_id');

  // // Rename the new column to the original column name
  // await queryInterface.renameColumn('category_items', 'temp_category_id', 'category_id');

  // console.log('Successfully changed category_id to UUID type');

  // await queryInterface.addColumn('product_variants','images',{
  //   type:DataTypes.TEXT
  // })
  // await queryInterface.addColumn('product_variants','stock',{
  //   type:DataTypes.INTEGER
  // })
  // await queryInterface.addColumn('product_variants','price',{
  //   type:DataTypes.DECIMAL(0,2)
  // })

  // await queryInterface.addColumn('product_variants', 'createdAt', {
  //   type: DataTypes.DATE,
  //   allowNull: true,
  //   defaultValue: DataTypes.NOW
  // });

  // await queryInterface.addColumn('product_variants', 'updatedAt', {
  //   type: DataTypes.DATE,
  //   allowNull: true,
  //   defaultValue: DataTypes.NOW
  // });

  // await queryInterface.addColumn('product_variants', 'deletedAt', {
  //   type: DataTypes.DATE,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'category_item_id_1', {
  //   type: DataTypes.UUID,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'category_item_id_2', {
  //   type: DataTypes.UUID,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'category_item_id_3', {
  //   type: DataTypes.UUID,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'created_by', {
  //   type: DataTypes.BIGINT,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'updated_by', {
  //   type: DataTypes.BIGINT,
  //   allowNull: true
  // });
  // await queryInterface.addColumn('product_variants', 'icon', {
  //   type: DataTypes.TEXT,
  //   allowNull: true
  // });

  // First check if the constraint exists
  //   const constraints = await queryInterface.showConstraint('product_variants');
  //   const pkeyExists = constraints.some(constraint => constraint.constraintName === 'product_variants_pkey');

  //   if (pkeyExists) {
  //     await queryInterface.removeConstraint('product_variants', 'product_variants_pkey');
  //   }

  //   // Create a sequence manually
  //   await queryInterface.sequelize.query('CREATE SEQUENCE product_variants_id_seq START WITH 1 INCREMENT BY 1');

  //   // Change column type to BIGINT and set default value from sequence
  //   await queryInterface.changeColumn('product_variants', 'id', {
  //     type: DataTypes.BIGINT,
  //     primaryKey: true,
  //     allowNull: false,
  //     defaultValue: sequelize.literal("nextval('product_variants_id_seq')")
  //   });

  //   // Add the primary key constraint back
  //   await queryInterface.addConstraint('product_variants', {
  //     fields: ['id'],
  //     type: 'primary key',
  //     name: 'product_variants_pkey'
  //   });

  //   // Set the sequence to be owned by the column
  //   await queryInterface.sequelize.query('ALTER SEQUENCE product_variants_id_seq OWNED BY product_variants.id');
  // } catch (error) {
  //   console.error('Error modifying product_variants table:', error);
  //   throw error;
  // }

  // await queryInterface.removeColumn('product_variants','title');
  // await queryInterface.removeColumn('product_variants','default_price');
  // await queryInterface.addColumn('product_variants','created_by',{
  //   type:DataTypes.STRING,
  //   allowNull:true
  // });
  // await queryInterface.addColumn('product_variants','updated_by',{
  //   type:DataTypes.STRING,
  //   allowNull:true
  // });

  // await queryInterface.removeColumn('product_variants', 'category_item_id_1');
  // await queryInterface.removeColumn('product_variants', 'category_item_id_2');
  // await queryInterface.removeColumn('product_variants', 'category_item_id_3');

  // await queryInterface.addColumn('product_variants', 'category_item_id_1', {
  //   type: DataTypes.BIGINT,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'category_item_id_2', {
  //   type: DataTypes.BIGINT,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants', 'category_item_id_3', {
  //   type: DataTypes.BIGINT,
  //   allowNull: true
  // });

  // await queryInterface.addColumn('product_variants','created_at',{
  //   type:DataTypes.DATE,
  //   defaultValue:DataTypes.NOW(),
  //   allowNull:true
  // })

  await queryInterface.addColumn("product_variants", "variant_id", {
    type: DataTypes.UUID,
    allowNull: true,
  });
};

// Stock History Migrations

async function fixStockHistoryTable() {
  try {
    // Create stock_history table if it doesn't exist
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("stock_history")) {
      await queryInterface.createTable("stock_history", {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        product_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "products",
            key: "id",
          },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        variant_id: {
          type: DataTypes.UUID, // Changed from STRING to UUID
          allowNull: true,
          references: {
            model: "product_variants",
            key: "id",
          },
          onDelete: "SET NULL",
          onUpdate: "CASCADE",
        },
        stocks_added: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        stock_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      });

      console.log("Created stock_history table");
    } else {
      // First remove the existing foreign key constraint if it exists
      try {
        await queryInterface.removeConstraint(
          "stock_history",
          "stock_history_variant_id_fkey"
        );
      } catch (error) {
        // Ignore error if constraint doesn't exist
      }

      // Then change the column type to UUID
      await queryInterface.changeColumn("stock_history", "variant_id", {
        type: DataTypes.STRING,
        allowNull: true,
      });

      // Finally add the foreign key constraint with correct types
      await queryInterface.addConstraint("stock_history", {
        fields: ["variant_id"],
        type: "foreign key",
        name: "stock_history_variant_id_fkey",
        references: {
          table: "product_variants",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }

    console.log(
      "Stock history table and relations created/updated successfully"
    );
  } catch (error) {
    console.error("Error fixing stock history table:", error);
    throw error;
  }
}

// Call the function to execute the migrations

const commentMigration = async () => {
  try {
    // First remove existing foreign key constraint if it exists
    try {
      await queryInterface.removeConstraint(
        "comments",
        "comments_user_id_fkey"
      );
    } catch (error) {
      // Ignore if constraint doesn't exist
    }

    // Change column type to UUID first
    await queryInterface.sequelize.query(`
      ALTER TABLE comments 
      ALTER COLUMN user_id TYPE UUID USING user_id::uuid
    `);

    // Then set the default value to NULL
    await queryInterface.sequelize.query(`
      ALTER TABLE comments 
      ALTER COLUMN user_id SET DEFAULT NULL
    `);

    // Finally add foreign key constraint with correct settings
    await queryInterface.addConstraint("comments", {
      fields: ["user_id"],
      type: "foreign key",
      name: "comments_user_id_fkey",
      references: {
        table: "users",
        field: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    console.log("Successfully migrated comments table user_id column");
  } catch (error) {
    console.error("Error during comment migration:", error.message);
    throw error;
  }
};

// RUNNING PART
// productVariant()
// migrateUserRoleEnum()
//commentMigration();
// fixStockHistoryTable();
// productCategory();
// productcategoryitems();
// productMigration();
// categoryItemMigration();
// addNewBrandColumn()
// addNewGalleryMediaColumn();
// removeConstraints();
// changeTableName();
// updateBlogCategoryConstraint();
// jobdown()
// jobaddColumn();
// Menudown();
// menuAddColumn();
// addSoftDelete();
