const { Op } = require('sequelize');
const menuManagementModel = require("../models/menuManagement/menuManagement.model");
const sequelizeConfig = require("../config/sequelize.config");

// Helper function to build hierarchical structure
const buildMenuHierarchy = (menus, parentId = null) => {
  return menus
    .filter(menu => menu.parent_menu_id === parentId)
    .map(menu => ({
      ...menu.toJSON(),
      children: buildMenuHierarchy(menus, menu.id)
    }));
};

// CREATE a new menu item
const createMenuManagement = async (req, res) => {
  const transaction = await sequelizeConfig.transaction();
  try {
    const { title, url, parent_menu_id, menu_type } = req.body;

    // Basic validation
    if (!title || !url || !menu_type) {
      await transaction.rollback();
      return res.status(400).json({ error: "Title, URL, and Menu Type are required." });
    }

    // Parent menu validation
    if (parent_menu_id) {
      const parentMenu = await menuManagementModel.findByPk(parent_menu_id, { transaction });
      if (!parentMenu) {
        await transaction.rollback();
        return res.status(400).json({ error: "Parent menu not found." });
      }

      // Type consistency check
      if (parentMenu.menu_type !== menu_type) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Cannot assign to parent with different menu type (${parentMenu.menu_type})`
        });
      }

      // Circular reference check
      const potentialParent = await menuManagementModel.findByPk(parent_menu_id);
      const isCircular = await potentialParent.isCircularReference(parent_menu_id);
      if (isCircular) {
        await transaction.rollback();
        return res.status(400).json({ error: "Circular reference detected" });
      }
    }

    const newMenu = await menuManagementModel.create({
      title,
      url,
      parent_menu_id,
      menu_type
    }, { transaction });

    await transaction.commit();
    return res.status(201).json(newMenu);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating menu:", error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: "Invalid parent menu reference" });
    }
    
    return res.status(500).json({ 
      error: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

// GET all menus (flat or hierarchical)
const getAllMenusManagement = async (req, res) => {
  try {
    const { hierarchy } = req.query;
    const menus = await menuManagementModel.findAll({
      order: [['createdAt', 'ASC']]
    });

    if (hierarchy === 'true') {
      return res.status(200).json(buildMenuHierarchy(menus));
    }
    
    return res.status(200).json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET single menu by ID
const getMenuManagementById = async (req, res) => {
  try {
    const menu = await menuManagementModel.findByPk(req.params.id, {
      include: [{
        model: menuManagementModel,
        as: 'children',
        attributes: ['id', 'title', 'url', 'menu_type']
      }]
    });

    if (!menu) {
      return res.status(404).json({ error: "Menu not found" });
    }

    return res.status(200).json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE menu by ID
const updateMenuManagement = async (req, res) => {
  const transaction = await sequelizeConfig.transaction();
  try {
    const menu = await menuManagementModel.findByPk(req.params.id, { transaction });
    if (!menu) {
      await transaction.rollback();
      return res.status(404).json({ error: "Menu not found" });
    }

    const { title, url, parent_menu_id, menu_type } = req.body;

    // Circular reference check
    if (parent_menu_id && parent_menu_id !== menu.parent_menu_id) {
      const isCircular = await menu.isCircularReference(parent_menu_id);
      if (isCircular) {
        await transaction.rollback();
        return res.status(400).json({ error: "Circular reference detected" });
      }

      const newParent = await menuManagementModel.findByPk(parent_menu_id, { transaction });
      if (!newParent) {
        await transaction.rollback();
        return res.status(400).json({ error: "New parent menu not found" });
      }

      if (newParent.menu_type !== (menu_type || menu.menu_type)) {
        await transaction.rollback();
        return res.status(400).json({
          error: `New parent has different menu type (${newParent.menu_type})`
        });
      }
    }

    await menu.update({
      title: title || menu.title,
      url: url || menu.url,
      parent_menu_id: parent_menu_id !== undefined ? parent_menu_id : menu.parent_menu_id,
      menu_type: menu_type || menu.menu_type
    }, { transaction });

    await transaction.commit();
    return res.status(200).json(menu);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating menu:", error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: "Invalid parent menu reference" });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE menu by ID
const deleteMenuManagement = async (req, res) => {
  const transaction = await sequelizeConfig.transaction();
  try {
    const menu = await menuManagementModel.findByPk(req.params.id, { transaction });
    if (!menu) {
      await transaction.rollback();
      return res.status(404).json({ error: "Menu not found" });
    }

    // Check for children
    const childCount = await menuManagementModel.count({
      where: { parent_menu_id: menu.id },
      transaction
    });

    if (childCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "Cannot delete menu with children",
        childCount
      });
    }

    await menu.destroy({ transaction });
    await transaction.commit();
    return res.status(200).json({ message: "Menu deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting menu:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createMenuManagement,
  getAllMenusManagement,
  getMenuManagementById,
  updateMenuManagement,
  deleteMenuManagement
};