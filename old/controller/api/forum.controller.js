const forumModel = require("../../models/forum/forum.model");
const forumImgModel = require("../../models/forum/forumImage.model");
const forumReplyModel = require("../../models/forum/replies.model");
const forumViewModel = require("../../models/forum/views.model");
const userModel = require("../../models/user.model");
const fs = require("fs");

const getAllForums = async (req, res) => {
  const limit = req?.query?.limit || 10;
  const page = req?.query?.page || 1;
  const offset = limit * (page - 1);

  // try {

  try {
    const forums = await forumModel.findAll({
      offset: offset,
      limit: limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: userModel,
          foreignKey: "author",
          as: "forum_user",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: forumReplyModel,
          foreignKey: "forum_id",
          as: "replies",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "repliers",
              attributes: {
                exclude: ["password"],
              },
            },
          ],
        },
      ],
    });
    res.status(200).json({ data: forums });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getForumDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const findForum = await forumModel.findByPk(id, {
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: userModel,
          foreignKey: "author",
          as: "forum_user",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: forumReplyModel,
          foreignKey: "forum_id",
          as: "replies",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "repliers",
              attributes: {
                exclude: ["password"],
              },
            },
          ],
        },
      ],
    });

    if (!findForum) {
      return res.status(404).json({ err: "Forum not-found" });
    }

    res.status(200).json({ data: findForum.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createForum = async (req, res) => {
  const { title, description } = req.body;
  console.log("started");

  try {
    if (title.length < 10 || title.length > 100) {
      return res
        .status(409)
        .json({ err: "Title must be between 10 and 100 characters" });
    }

    const createForum = await forumModel.create({
      title: title,
      description: description,
      author: req?.user?.id,
    });

    res.status(201).json({
      msg: "Forum Created Successfully",
      data: createForum.dataValues,
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
      return res.status(404).json({ err: "forum not-found" });
    }

    const updateForum = await forumModel.update(req?.body, {
      where: {
        id: id,
      },
    });

    return res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteForum = async (req, res) => {
  const { id } = req.params;

  try {
    const findForum = await forumModel.findByPk(id);
    if (!findForum) {
      return res.status(404).json({ err: "Forum not-found" });
    }

    await findForum.destroy();
    return res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createReply = async (req, res) => {
  const { forum_id } = req.params;
  const { reply } = req.body;

  try {
    const findForum = await forumModel.findByPk(forum_id);

    if (!findForum) {
      return res.status(404).json({ err: "Forum not-found" });
    }
    const createReply = await forumReplyModel.create({
      reply: reply,
      forum_id: forum_id,
      user_id: req?.user?.id,
    });
    res.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateReply = async (req, res) => {
  const { forum_id, reply_id } = req.params;
  const { reply } = req.body;
  try {
    const findForumReply = await forumReplyModel.findByPk(reply_id);

    if (!findForumReply) {
      return res.status(404).json({ err: "Forum reply not-found" });
    }
    const updateReply = await forumReplyModel.update(
      {
        reply: reply,
      },
      {
        where: {
          id: reply_id,
        },
      }
    );
    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteReply = async (req, res) => {
  const { reply_id, forum_id } = req.params;
  try {
    const findForumReply = await forumReplyModel.findByPk(reply_id);

    if (!findForumReply) {
      return res.status(404).json({ err: "Forum Reply not-found" });
    }
    await findForumReply.destroy();

    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//forum views controller

// const createView=async(req,res)=>{
//   const {forum_id}=req.params;
//   try {

//     const findForum=await forumViewModel.findOne({
//       where:{
//         forum_id:forum_id
//       }
//     })

//     if(!findForum){
//       return res.status(404).json({err:'Forum not-found'})
//     }
//     const isViewed=await forumViewModel.findOne({
//       where:{
//         user_id:req?.user?.id,
//         forum_id:forum_id
//       }
//     });

//     if(isViewed){
//       return res.status(400).json({err:'Already Viewed'})
//     }

//     await forumViewModel.create({
//       user_id:req?.user?.id,
//       forum_id:forum_id
//     })

//   } catch (error) {
//     res.status(500).json({err:error.message})
//   }
// }

module.exports = {
  getAllForums,
  getForumDetail,
  createForum,
  updateForum,
  deleteForum,
  createReply,
  deleteReply,
  updateReply,
};
