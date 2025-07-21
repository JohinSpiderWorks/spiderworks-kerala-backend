const { Op } = require("sequelize");
const notificationModel = require("../models/notification/notification.model");
const userModel = require("../models/user.model");
const emailValidator = require("email-validator");

// const getAllNotifications = async (req, res) => {
//   try {
//     console.log(req?.query);
//     if(req?.query?.id){
//       await notificationModel.update({
//         is_active:req?.query?.is_active=='true' ? 'false':'true'
//       },{
//         where:{
//           id:req?.query?.id
//         }
//       })
//     }

//     const notifications = await notificationModel.findAll({
//       order: [["createdAt", "DESC"]],
//     });
//     const users = await userModel.findAll({
//       attributes: {
//         include: ["name", "id"],
//       },
//       where: {
//         role: {
//           [Op.ne]: "admin",
//         },
//       },
//     });
//     res.render("notifications/index", {
//       data: notifications,
//       title: "Notifications",
//       users: users,
//       query: {},
//     });
//     // res.status(200).json({ data: notifications });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllNotifications = async (req, res) => {
  try {
    console.log(req.query);

    if (req.query.id) {
      await notificationModel.update(
        {
          is_active: req.query.is_active === "true" ? "false" : "true",
        },
        {
          where: {
            id: req.query.id,
          },
        }
      );
    }

    const notifications = await notificationModel.findAll({
      order: [["createdAt", "DESC"]],
    });

    const users = await userModel.findAll({
      attributes: ["name", "id"],
      where: {
        role: {
          [Op.ne]: "admin",
        },
      },
    });

    res.status(200).json({
      success: true,
      data: notifications,
      users: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await notificationModel.findByPk(id, {
      include: [
        {
          model: userModel,
          as: "notified_by",
        },
      ],
    });
    if (!notification) {
      return res.status(404).json({ err: "notification not-found" });
    }
    res.status(200).json({ data: notification.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createNotification = async (req, res) => {
  let { name, type, option, contact } = req.body;
  try {
    if (name == "" || name?.length < 3) {
      return res
        .status(400)
        .json({ type: "name", err: "Please Enter Valid Name" });
    }
    if (type == "email") {
      if (!emailValidator.validate(contact)) {
        return res
          .status(400)
          .json({ type: "email", err: "Please Enter Valid Email" });
      }
    } else {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(contact)) {
        return res
          .status(400)
          .json({ type: "email", err: "Please Enter Valid Mobile Number" });
      }
    }
    const createNotification = await notificationModel.create({
      name,
      type,
      option,
      contact,
      created_by: req?.user?.id,
    });

    res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const findNotification = await notificationModel.findByPk(id);
    if (!findNotification) {
      return res.status(404).json({ err: "notification not-found" });
    }

    if (req?.body?.name == "" || req?.body?.name?.length < 3) {
      return res
        .status(400)
        .json({ type: "name", err: "Please Enter Valid Name" });
    } else if (req?.body?.type == "email") {
      if (!emailValidator.validate(req?.body?.contact)) {
        return res
          .status(400)
          .json({ type: "email", err: "Please Enter Valid Email" });
      }
    } else {
      const phonePattern = /^[0-9]{10}$/;
      if (!phonePattern.test(req?.body?.contact)) {
        return res
          .status(400)
          .json({ type: "email", err: "Please Enter Valid Mobile Number" });
      }
    }

    await notificationModel.update(req.body, {
      where: {
        id: id,
      },
    });
    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  try {
    const findNotification = await notificationModel.findByPk(id);
    if (!findNotification) {
      return res.status(404).json({ err: "notification not-found" });
    }
    await findNotification.destroy();
    res.redirect("/admin/notifications");
    // res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllNotifications,
  getNotification,
  createNotification,
  updateNotification,
  deleteNotification,
};
