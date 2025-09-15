const { Op } = require("sequelize");
const menuModel = require("../../models/menu/menu.model");
const settingsModel = require("../../models/settings/settings.model");

const AllMainDesktop = async (req, res) => {
  try {
    // Function to generate the include array recursively for 'n' levels of submenus
    function generateInclude(levels) {
      if (levels === 0) return []; // Base case: no more levels to include

      return [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
          include: generateInclude(levels - 1), // Recursive call to generate the next level of includes
        },
      ];
    }

    // Determine the number of levels you want to include dynamically
    const maxLevels = 5; // For example, this could be set dynamically

    // Query to find all menus with dynamic includes
    const mainDesktop = await menuModel.findAll({
      where: {
        menu: "md",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    const settings = await settingsModel.findAll({
      where: {
        key: {
          [Op.in]: ["logo", "favicon"],
        },
      },
    });

    console.log(mainDesktop);

    res.status(200).json({ data: mainDesktop, icon: settings });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const AllFooterDesktop = async (req, res) => {
  try {
    function generateInclude(levels) {
      if (levels === 0) return []; // Base case: no more levels to include

      return [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
          include: generateInclude(levels - 1), // Recursive call to generate the next level of includes
        },
      ];
    }

    const maxLevels = 5; // Example dynamic level

    const footerDesktop = await menuModel.findAll({
      where: {
        menu: "fd",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });
    res.status(200).json({ data: footerDesktop });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const AllMainMobile = async (req, res) => {
  try {
    function generateInclude(levels) {
      if (levels === 0) return []; // Base case: no more levels to include

      return [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
          include: generateInclude(levels - 1), // Recursive call to generate the next level of includes
        },
      ];
    }

    const maxLevels = 5; // Example dynamic level

    const mainMobile = await menuModel.findAll({
      where: {
        menu: "mm",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    res.status(200).json({ data: mainMobile });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const AllFooterMobile = async (req, res) => {
  try {
    function generateInclude(levels) {
      if (levels === 0) return []; // Base case: no more levels to include

      return [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
          include: generateInclude(levels - 1), // Recursive call to generate the next level of includes
        },
      ];
    }

    const maxLevels = 5; // Example dynamic level

    const footerMobile = await menuModel.findAll({
      where: {
        menu: "fm",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    res.status(200).json({ data: footerMobile });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  AllMainDesktop,
  AllFooterDesktop,
  AllMainMobile,
  AllFooterMobile,
};
