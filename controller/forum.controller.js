const bannerImageModel = require("../models/bannerImage.model");
const blogModel = require("../models/blog.model");
const blogCommentModel = require("../models/blogComment.model");
const blogSectionModel = require("../models/blogSection.model");
const forumModel = require("../models/forum/forum.model");
const forumImgModel = require("../models/forum/forumImage.model");
const forumReplyModel = require("../models/forum/replies.model");
const userModel = require("../models/user.model");
const fs = require("fs");

// const getAllForums = async (req, res) => {
//   const limit = req?.query?.limit || 10;
//   const page = req?.query?.page || 1;
//   const offset = limit * (page - 1);

//   console.log(req.query);

//   // try {

//   try {

//     if(req?.query?.status){
//       await forumModel.update({
//         status:req?.query?.status
//       },{
//         where:{
//           id:req.query?.id
//         }
//       })

//       return res.redirect('/admin/dashboard/forums')
//     }
//     const forums = await forumModel.findAll({
//       offset: offset,
//       limit: limit,
//       order: [["createdAt", "DESC"]],
//       include: [
//         {
//           model: userModel,
//           foreignKey: "author",
//           as: "forum_user",
//           attributes: {
//             exclude: ["password"],
//           },
//         },
//         {
//           model: forumReplyModel,
//           foreignKey: "forum_id",
//           as: "replies",
//           include: [
//             {
//               model: userModel,
//               foreignKey: "author",
//               as: "repliers",
//               attributes: {
//                 exclude: ["password"],
//               },
//             },
//           ],
//         },
//       ],
//     });

//     res.render("forum/forums", {
//       data: forums,
//       title: "Forums List",
//       query: {},
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllForums = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = limit * (page - 1);

    if (req.query.status) {
      await forumModel.update(
        { status: req.query.status },
        { where: { id: req.query.id } }
      );
      return res.json({ message: "Status updated successfully" });
    }

    const forums = await forumModel.findAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: userModel,
          as: "forum_user",
          attributes: { exclude: ["password"] },
        },
        {
          model: forumReplyModel,
          as: "replies",
          include: [
            {
              model: userModel,
              as: "repliers",
              attributes: { exclude: ["password"] },
            },
          ],
        },
      ],
    });

    res.json({ forums });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createForum = async (req, res) => {
  const { title, description } = req.body;

  try {
    if (title.length < 10 || title.length > 100) {
      return res
        .status(409)
        .json({ err: "Title must be between 10 and 100 characters" });
    }

    const create = await forumModel.create({
      title: title,
      description: description,
      author: req?.user?.id,
    });

    res.status(200).json({ msg: "Forum Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// const getUpdateForum = async (req, res) => {
//   const { id } = req.params;

//   console.log(req?.query);

//   try {
//     const findForum = await forumModel.findByPk(id);

//     if (!findForum) {
//       return res.status(404).json({ err: "Forum not-found" });
//     }

//     res.render("forum/updateforum", {
//       title: "Update Forum",
//       data: findForum.dataValues,
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getUpdateForum = async (req, res) => {
  const { id } = req.params; // Use query params in Next.js

  console.log(req.params); // For debugging purposes, you can log the query params

  try {
    const findForum = await forumModel.findByPk(id);

    if (!findForum) {
      return res.status(404).json({ err: "Forum not found" });
    }

    // Return JSON instead of rendering a view
    res.status(200).json({
      title: "Update Forum",
      data: findForum.dataValues,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateForum = async (req, res) => {
  const { id } = req.params;

  console.log(req?.body);
  try {
    const findForum = await forumModel.findByPk(id);

    if (!findForum) {
      return res.status(404).json({ err: "Forum not-found" });
    }
    const updateForum = await forumModel.update(
      {
        title: req?.body?.title,
        description: req?.body?.description,
      },
      {
        where: {
          id: id,
        },
      }
    );

    return res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateForumStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Get new status from request body

  try {
    const findForum = await forumModel.findByPk(id);

    if (!findForum) {
      return res.status(404).json({ err: "Forum not found" });
    }

    // Update only the status field
    await forumModel.update({ status }, { where: { id } });

    return res.status(200).json({ msg: "Status updated successfully", status });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateSingleForum = async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body; // Get updated values

  try {
    const forum = await forumModel.findByPk(id);

    if (!forum) {
      return res.status(404).json({ err: "Forum not found" });
    }

    // Update the forum details
    await forum.update({ title, description, status });

    return res.status(200).json({ msg: "Forum updated successfully", forum });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteForum = async (req, res) => {
  const { id } = req.params;

  try {
    const findForum = await forumModel.findByPk(id);
    if (!findForum) {
      return res.status(404).json({ err: "Blog notfound" });
    }

    await findForum.destroy();
    res.redirect("/admin/dashboard/forums");
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  getAllForums,
  createForum,
  getUpdateForum,
  updateForum,
  deleteForum,
  updateForumStatus,
  updateSingleForum,
};
