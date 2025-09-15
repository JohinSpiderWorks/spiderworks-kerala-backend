const { DataTypes } = require("sequelize");
const sequelizeConfig = require("../../config/sequelize.config");

const menuManagementModel = sequelizeConfig.define(
  "menu_management",
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
    parent_menu_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: "menu_management", // This creates the self-reference
        key: "id",
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    menu_type: {
      type: DataTypes.ENUM("Header Menu", "Footer Menu"),
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['parent_menu_id'] // Improves query performance
      }
    ]
  }
);

// Associations
menuManagementModel.hasMany(menuManagementModel, {
  as: 'children',
  foreignKey: 'parent_menu_id',
  hooks: true // Enable hooks for cascading operations
});

menuManagementModel.belongsTo(menuManagementModel, {
  as: 'parent',
  foreignKey: 'parent_menu_id'
});

// Add instance method to check for circular references
menuManagementModel.prototype.isCircularReference = async function(potentialParentId) {
  if (!potentialParentId) return false;
  if (potentialParentId === this.id) return true;
  
  let current = await menuManagementModel.findByPk(potentialParentId);
  while (current) {
    if (current.parent_menu_id === this.id) return true;
    current = await menuManagementModel.findByPk(current.parent_menu_id);
  }
  return false;
};

module.exports = menuManagementModel;