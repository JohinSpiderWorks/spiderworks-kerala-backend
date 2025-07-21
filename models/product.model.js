const { Sequelize, DataTypes } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config"); // Your database connection

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

// ProductCategory model
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

// ProductCategoryMapping model
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

// ProductVariant model
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

// ProductMedia model
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

// Export the models
module.exports = {
  Product,
  ProductCategory,
  ProductCategoryMapping,
  ProductVariant,
  ProductMedia,
};
