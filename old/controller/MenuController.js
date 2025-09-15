const menuModel = require("../models/Menu");

const createMenu = async (req, res) => {
  try {
    const { menuName, menuTitle, position, menuItems } = req.body;

    // Ensure the user is authenticated and get the createdBy value
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ err: "Unauthorized: User not authenticated" });
    }
    const createdBy = req.user.id;

    // Validate required fields (excluding createdBy)
    const requiredFields = ["menuName", "menuTitle", "position", "menuItems"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ err: `${field} is required` });
      }
    }

    // Validate menuItems structure
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return res
        .status(400)
        .json({ err: "menuItems must be a non-empty array" });
    }

    // Validate each menu item
    for (const item of menuItems) {
      if (!item.url || !item.linkText) {
        return res
          .status(400)
          .json({ err: "Each menu item must have a url and linkText" });
      }
    }

    // Create the menu
    const newMenu = await menuModel.create({
      menuName,
      menuTitle,
      position,
      createdBy,
      menuItems,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: newMenu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllMenus = async (req, res) => {
  try {
    // Fetch all menus, ordered by createdAt in descending order
    const menus = await menuModel.findAll({
      order: [["createdAt", "DESC"]],
      where: {
        deletedAt: null, // Exclude soft-deleted menus
      },
    });

    // Return JSON response
    res.status(200).json({ success: true, data: menus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Menu
const updateMenu = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ err: "Unauthorized: User not authenticated" });
    }

    const menuId = req.params.id;
    const { menuName, menuTitle, position, menuItems } = req.body;

    // Find the menu to update
    const menu = await menuModel.findByPk(menuId);
    if (!menu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    // Check if the user has permission to update this menu
    // if (menu.createdBy !== req.user.id) {
    //   return res
    //     .status(403)
    //     .json({ err: "Forbidden: You can only update your own menus" });
    // }

    // Validate required fields if they are provided
    if (menuItems) {
      if (!Array.isArray(menuItems) || menuItems.length === 0) {
        return res
          .status(400)
          .json({ err: "menuItems must be a non-empty array" });
      }

      // Validate each menu item
      for (const item of menuItems) {
        if (!item.url || !item.linkText) {
          return res
            .status(400)
            .json({ err: "Each menu item must have a url and linkText" });
        }
      }
    }

    // Update the menu with provided fields
    const updatedMenu = await menu.update({
      menuName: menuName || menu.menuName,
      menuTitle: menuTitle || menu.menuTitle,
      position: position || menu.position,
      menuItems: menuItems || menu.menuItems,
    });

    res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Menu (soft delete)
const deleteMenu = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ err: "Unauthorized: User not authenticated" });
    }

    const menuId = req.params.id;
    const menu = await menuModel.findByPk(menuId);
    if (!menu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    if (menu.createdBy !== req.user.id) {
      return res
        .status(403)
        .json({ err: "Forbidden: You can only delete your own menus" });
    }

    console.log("Before delete - Menu:", menu.toJSON());
    await menu.destroy(); // Hard delete the menu
    console.log(
      "After delete - Menu should be gone, checking:",
      await menuModel.findByPk(menuId)
    );

    res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Single Menu
const getSingleMenu = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ err: "Unauthorized: User not authenticated" });
    }

    const menuId = req.params.id;

    // Find the menu by ID
    const menu = await menuModel.findOne({
      where: {
        id: menuId,
        deletedAt: null, // Exclude soft-deleted menus
      },
    });

    // Check if menu exists
    if (!menu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    // Return the menu
    res.status(200).json({
      success: true,
      data: menu,
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createMenu,
  getAllMenus,
  updateMenu,
  deleteMenu,
  getSingleMenu,
};
