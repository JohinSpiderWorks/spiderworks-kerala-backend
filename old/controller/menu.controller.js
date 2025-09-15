const { Op } = require("sequelize");
const sequelizeConfig = require("../config/sequelize.config");
const menuModel = require("../models/menu/menu.model");

const getMainDesktopChild = async (req, res) => {
  const { id } = req.params;
  try {
    const mainDesktop = await menuModel.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: menuModel,
          foreignKey: "parent_id",
          as: "submenu",
        },
      ],
    });

    res.status(200).json({ data: mainDesktop });
    // res.render("menu/allmaindesktop", {
    //   title: "All Main Desktop Menus",
    //   data: mainDesktop,
    // });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//testing new
const createMenu = async (req, res) => {
  try {
    const menuData = req.body;
    const newMenu = await Menu.create(menuData);
    res.status(201).json(newMenu);
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ error: "Failed to create menu" });
  }
};

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

    console.log(mainDesktop);

    // res.json({data:mainDesktop})

    res.render("menu/allmaindesktop", {
      title: "Desktop Main Menu",
      data: mainDesktop,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createMainDesktop = async (req, res) => {
  const { title, tooltip, priority, link } = req.body;
  console.log("working");
  console.log(req.files);
  console.log(req.body);
  console.log(req.query);
  try {
    const newMenu = {
      title: title,
      tooltip: tooltip,
      priority: priority,
      link: link,
      parent_id: req?.query?.parent_id,
      icon: req?.file ? `/uploads/icons/${req.file.filename}` : null,
      menu: "md",
    };

    const data = await menuModel.create(newMenu);
    console.log(data);
    res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error.message });
  }
};

const updateMainDesktop = async (req, res) => {
  const { id } = req.params;
  const { title, tooltip, priority, link } = req.body;

  try {
    const findMenu = await menuModel.findByPk(id);
    console.log("start");

    if (!findMenu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    console.log(req.file);

    // Prepare update fields
    const updateData = {
      title: title || findMenu.dataValues.title,
      tooltip: tooltip || findMenu.dataValues.tooltip,
      priority: priority || findMenu.dataValues.priority,
      link: link || findMenu.dataValues.link,
      icon: findMenu.dataValues.icon,
    };

    console.log({ file: req.file });
    console.log(req.files);
    console.log(updateData);

    if (req.file) {
      updateData.icon = `/uploads/icons/${req.file.filename}`;
    }

    // Update the model instance using the `update` method
    const updateMenuModel = await menuModel.update(
      {
        title: title,
        tooltip: tooltip,
        priority: priority,
        link: link,
        icon: req?.file
          ? `/uploads/icons/${req?.file?.filename}`
          : findMenu.dataValues.icon,
      },
      {
        where: { id },
      }
    );

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteMainDesktop = async (req, res) => {
  const { id } = req.params;

  try {
    const findMenu = await menuModel.findByPk(id);

    if (!findMenu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    await findMenu.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// footer Desktop

const getFooterDesktopDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const footerDesktop = await menuModel.findOne({
      where: {
        id: id,
        menu: "fd", // Filter by footer desktop menu type
      },
      include: [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
        },
      ],
    });

    res.status(200).json({ data: footerDesktop });
    // res.render("menu/allfooterdesktop", {
    //   title: "All Footer Desktop Menus",
    //   data: footerDesktop,
    // });
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

    const mainDesktop = await menuModel.findAll({
      where: {
        menu: "fd",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    res.render("menu/allfooterdesktop", {
      title: "Desktop Footer Menu",
      data: mainDesktop,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createFooterDesktop = async (req, res) => {
  const { title, tooltip, priority, link } = req.body;
  try {
    await menuModel.create({
      title: title,
      tooltip: tooltip,
      priority: priority,
      link: link,
      parent_id: req?.query?.parent_id,
      icon: req?.file ? `/uploads/icons/${req.file.filename}` : null,
      menu: "fd",
    });

    return res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateFooterDesktop = async (req, res) => {
  const { id } = req.params;
  const { title, tooltip, priority, link } = req.body;

  try {
    const updateData = {
      title: title,
      tooltip: tooltip,
      priority: priority,
      link: link,
      menu: "fd",
    };

    if (req.file) {
      updateData.icon = `/uploads/icons/${req.file.filename}`;
    }

    await menuModel.update(updateData, {
      where: { id },
    });

    return res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteFooterDesktop = async (req, res) => {
  const { id } = req.params;

  try {
    const findMenu = await menuModel.findByPk(id);

    if (!findMenu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    await findMenu.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// main mobile

const getMainMobileDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const mainMobile = await menuModel.findOne({
      where: {
        id: id,
        menu: "mm", // Filter by main mobile menu type
      },
      include: [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
        },
      ],
    });

    res.status(200).json({ data: mainMobile });
    // res.render("menu/allmainmobile", {
    //   title: "All Main Mobile Menus",
    //   data: mainMobile,
    // });
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

    const mainDesktop = await menuModel.findAll({
      where: {
        menu: "mm",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    res.render("menu/allmainmobile", {
      title: "Mobile Main Menu",
      data: mainDesktop,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createMainMobile = async (req, res) => {
  const { title, tooltip, priority } = req.body;
  try {
    await menuModel.create({
      title: title,
      tooltip: tooltip,
      priority: priority,
      parent_id: req?.query?.parent_id,
      icon: req?.file ? `/uploads/icons/${req.file.filename}` : null,
      menu: "mm",
    });

    return res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateMainMobile = async (req, res) => {
  const { id } = req.params;
  const { title, tooltip, priority, link } = req.body;

  try {
    const updateData = {
      title: title,
      tooltip: tooltip,
      priority: priority,
      link: link,
      menu: "mm",
    };

    if (req.file) {
      updateData.icon = `/uploads/icons/${req.file.filename}`;
    }

    await menuModel.update(updateData, {
      where: { id },
    });

    return res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteMainMobile = async (req, res) => {
  const { id } = req.params;

  try {
    const findMenu = await menuModel.findByPk(id);

    if (!findMenu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    await findMenu.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// footer mobile

const getFooterMobileDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const footerMobile = await menuModel.findOne({
      where: {
        id: id,
        menu: "fm", // Filter by footer mobile menu type
      },
      include: [
        {
          model: menuModel,
          as: "submenu",
          foreignKey: "parent_id",
          required: false,
        },
      ],
    });

    res.status(200).json({ data: footerMobile });
    // res.render("menu/allfootermobile", {
    //   title: "All Footer Mobile Menus",
    //   data: footerMobile,
    // });
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

    const mainDesktop = await menuModel.findAll({
      where: {
        menu: "fm",
        parent_id: {
          [Op.eq]: "null",
        },
      },
      include: generateInclude(maxLevels),
      order: [["priority", "ASC"]],
    });

    res.render("menu/allfootermobile", {
      title: "Mobile Footer Menu",
      data: mainDesktop,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createFooterMobile = async (req, res) => {
  const { title, tooltip, priority } = req.body;

  try {
    const data = await menuModel.create({
      title: title,
      tooltip: tooltip,
      priority: priority,
      icon: req?.file ? `/uploads/icons/${req.file.filename}` : null,
      parent_id: req?.query?.parent_id,
      menu: "fm",
    });
    return res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateFooterMobile = async (req, res) => {
  const { id } = req.params;
  const { title, tooltip, priority, link } = req.body;

  try {
    const updateData = {
      title: title,
      tooltip: tooltip,
      priority: priority,
      link: link,
      menu: "fm",
    };

    if (req.file) {
      updateData.icon = `/uploads/icons/${req.file.filename}`;
    }

    await menuModel.update(updateData, {
      where: { id },
    });

    return res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteFooterMobile = async (req, res) => {
  const { id } = req.params;

  try {
    const findMenu = await menuModel.findByPk(id);

    if (!findMenu) {
      return res.status(404).json({ err: "Menu not found" });
    }

    await findMenu.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  AllFooterDesktop,
  AllFooterMobile,
  createFooterDesktop,
  createFooterMobile,
  updateFooterDesktop,
  updateFooterMobile,
  deleteFooterDesktop,
  deleteFooterMobile,
  AllMainDesktop,
  AllMainMobile,
  deleteMainMobile,
  updateMainMobile,
  createMainDesktop,
  createMainMobile,
  deleteMainDesktop,
  updateMainDesktop,
  getMainDesktopChild,
  getFooterDesktopDetail,
  getFooterMobileDetail,
  getMainMobileDetail,
};
