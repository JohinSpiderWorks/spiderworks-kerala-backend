const redirectModel = require("../models/redirect/redirect.model");

// const getAllRedirects = async (req, res) => {
//   try {
//     const redirects = await redirectModel.findAll();
//     // res.status(200).json({ data: redirects });
//     res.render("redirect/index", { data: redirects, title: "301 Redirect" });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllRedirects = async (req, res) => {
  try {
    const redirects = await redirectModel.findAll();
    res.status(200).json({ success: true, data: redirects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRedirect = async (req, res) => {
  const { id } = req.params;
  try {
    const findRedirect = await redirectModel.findByPk(id);
    if (!findRedirect) {
      return res.status(404).json({ err: "Redirect not-found" });
    }
    res.status(200).json({ data: findRedirect.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createRedirect = async (req, res) => {
  const { redirect_to, redirect_from } = req.body;
  try {
    const createRedirect = await redirectModel.create({
      redirect_to,
      redirect_from,
    });

    res.status(201).json({ msg: "Create Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.errors[0].message });
  }
};

const updateRedirect = async (req, res) => {
  const { id } = req.params;
  try {
    const findRedirect = await redirectModel.findByPk(id);
    if (!findRedirect) {
      return res.status(404).json({ err: "Redirect not-found" });
    }
    await redirectModel.update(req.body, {
      where: {
        id: id,
      },
    });
    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.errors[0].message });
  }
};

const deleteRedirect = async (req, res) => {
  const { id } = req.params;
  try {
    const findRedirect = await redirectModel.findByPk(id);
    if (!findRedirect) {
      return res.status(404).json({ err: "Redirect not-found" });
    }
    await findRedirect.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllRedirects,
  getRedirect,
  createRedirect,
  updateRedirect,
  deleteRedirect,
};
