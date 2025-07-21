require("dotenv").config({ path: "../.env" });
const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");

const migrateBlogAuthorRelations = async () => {
  const queryInterface = sequelizeConfig.getQueryInterface();

  try {
    console.log("Starting blog relationships migration...");
    await sequelizeConfig.authenticate();
    console.log("Database connection established.");

    const tables = await queryInterface.showAllTables();
    const blogExists = tables.includes("blog");
    const authorExists = tables.includes("author");
    const usersExists = tables.includes("users");

    if (!blogExists) {
      throw new Error(
        "Blog table does not exist - run blog model migration first"
      );
    }

    // Handle Author Table
    if (!authorExists) {
      console.log("Creating author table with full schema...");
      await queryInterface.createTable("author", {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
          defaultValue: DataTypes.UUIDV4,
        },
        name: { type: DataTypes.STRING, allowNull: false },
        // ... (rest of author fields as in your original) ...
      });
      // ... (rest of author table creation as in your original) ...
    } else {
      console.log("Author table exists - checking for missing columns...");
      // ... (rest of author table check logic as in your original) ...
    }

    // Safely add columns with data preservation
    const blogColumns = await queryInterface.describeTable("blog");

    // Add author_id if not exists
    if (!blogColumns.author_id) {
      console.log("Adding author_id column to blog table...");
      await queryInterface.addColumn("blog", "author_id", {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    // Add created_by if not exists
    if (!blogColumns.created_by) {
      if (usersExists) {
        console.log("Adding created_by column to blog table...");
        await queryInterface.addColumn("blog", "created_by", {
          type: DataTypes.STRING,
          allowNull: true,
        });
      } else {
        console.log("Users table doesn't exist - skipping created_by column");
      }
    }

    // Remove old constraints if they exist
    const constraints = await queryInterface.showConstraint("blog");
    const oldConstraints = constraints.filter((c) =>
      ["author", "created_by"].some((term) => c.constraintName.includes(term))
    );

    for (const constraint of oldConstraints) {
      await queryInterface.removeConstraint("blog", constraint.constraintName);
      console.log(`Removed old constraint: ${constraint.constraintName}`);
    }

    // Add new foreign key constraints with data verification
    if (authorExists) {
      console.log("Verifying author_id data integrity...");
      await queryInterface.sequelize.query(`
        UPDATE blog SET author_id = NULL 
        WHERE author_id IS NOT NULL 
        AND author_id NOT IN (SELECT id FROM author)
      `);

      await queryInterface.addConstraint("blog", {
        fields: ["author_id"],
        type: "foreign key",
        name: "blog_author_id_fk",
        references: {
          table: "author",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
      console.log("Added blog-author foreign key constraint");
    }

    if (usersExists) {
      console.log("Verifying created_by data integrity...");
      await queryInterface.sequelize.query(`
        UPDATE blog SET created_by = NULL 
        WHERE created_by IS NOT NULL 
        AND created_by NOT IN (SELECT id FROM users)
      `);

      await queryInterface.addConstraint("blog", {
        fields: ["created_by"],
        type: "foreign key",
        name: "blog_created_by_fk",
        references: {
          table: "users",
          field: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
      console.log("Added blog-created_by foreign key constraint");
    }

    // Handle image constraints
    const requiredBlogConstraints = [
      { name: "blog_banner_id_fk", field: "banner_id", table: "blog_images" },
      {
        name: "blog_featured_id_fk",
        field: "featured_id",
        table: "blog_images",
      },
      { name: "blog_og_id_fk", field: "og_id", table: "blog_images" },
    ];

    for (const constraint of requiredBlogConstraints) {
      if (tables.includes(constraint.table)) {
        console.log(`Verifying ${constraint.field} data integrity...`);
        await queryInterface.sequelize.query(`
          UPDATE blog SET ${constraint.field} = NULL 
          WHERE ${constraint.field} IS NOT NULL 
          AND ${constraint.field} NOT IN (SELECT id FROM ${constraint.table})
        `);

        const exists = constraints.some(
          (c) => c.constraintName === constraint.name
        );
        if (!exists) {
          await queryInterface.addConstraint("blog", {
            fields: [constraint.field],
            type: "foreign key",
            name: constraint.name,
            references: {
              table: constraint.table,
              field: "id",
            },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
          });
          console.log(`Added ${constraint.field} foreign key constraint`);
        }
      }
    }

    console.log("Blog relationships migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sequelizeConfig.close();
    console.log("Database connection closed.");
  }
};

// Execute migration
migrateBlogAuthorRelations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
