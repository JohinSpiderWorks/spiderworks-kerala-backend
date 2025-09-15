const { passwordStrength } = require("check-password-strength");
const authorModel = require("../models/author.model");
const bannerImageModel = require("../models/bannerImage.model");
const blogModel = require("../models/blog.model");
const blogCategoryModel = require("../models/blogCategory.model");
const blogCategoryMapModel = require("../models/blogCategoryMap.model");
const blogCommentModel = require("../models/blogComment.model");
const blogFavouriteModel = require("../models/blogFavourite");
const blogLikeModel = require("../models/blogLike.model");
const blogReplyModel = require("../models/blogReply.model");
const blogSaveModel = require("../models/blogSave.model");
const blogSectionModel = require("../models/blogSection.model");
const blogTopicModel = require("../models/blogTopics.model");
const userModel = require("../models/user.model");
const fs = require("fs");
const slugify = require("slugify");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var emailValidator = require("email-validator");
const pageSectionModel = require("../models/page/section.model");
const pageModel = require("../models/page/page.model");

require("dotenv").config();

//get all blogs
// const getAllBlogs = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Ensure `page` is an integer
//     const limit = parseInt(req.query.limit) || 15; // Ensure `limit` is an integer
//     const offset = (page - 1) * limit;

//     const { count, rows } = await blogModel.findAndCountAll({
//       order: [["createdAt", "DESC"]],
//       limit: limit,
//       offset: offset,
//       include: [
//         {
//           model: userModel,
//           as: "created_by",
//           attributes: { exclude: ["password"] },
//         },
//         {
//           model: bannerImageModel,
//           as: "banner",
//         },
//         {
//           model: bannerImageModel,
//           as: "featured",
//         },
//         {
//           model: bannerImageModel,
//           as: "og",
//         },
//         {
//           model: blogSectionModel,
//           as: "sections",
//         },
//         {
//           model: blogCommentModel,
//           as: "comments",
//           include: [
//             {
//               model: userModel,
//               as: "commented_by",
//               attributes: { exclude: ["password"] },
//             },
//             {
//               model: blogLikeModel,
//               as: "likes",
//               include: [
//                 {
//                   model: userModel,
//                   as: "liked_by",
//                   attributes: { exclude: ["password"] },
//                 },
//               ],
//             },
//             {
//               model: blogReplyModel,
//               as: "comment_replies",
//               include: [
//                 {
//                   model: userModel,
//                   as: "replied_by",
//                   attributes: { exclude: ["password"] },
//                 },
//               ],
//             },
//           ],
//           separate: true,
//           order: [["createdAt", "DESC"]],
//         },
//       ],
//       where: {
//         premium: false,
//       },
//     });

//     // Calculate total pages
//     const totalPages = Math.ceil(count / limit);
//     res.json({
//       currentPage: page,
//       totalPages: totalPages,
//       totalResults: count,
//       nextPage: page < totalPages ? page + 1 : null,
//       nextPageUrl:
//         page < totalPages
//           ? `${process.env.BACKEND_URL}/blogs?page=${page + 1}&limit=${limit}`
//           : null,
//       previousPageUrl:
//         page > 1
//           ? `${process.env.BACKEND_URL}/blogs?page=${page - 1}&limit=${limit}`
//           : null,
//       firstPageUrl: `${process.env.BACKEND_URL}/blogs?page=1&limit=${limit}`,
//       lastPageUrl: `${process.env.BACKEND_URL}/blogs?page=${totalPages}&limit=${limit}`,
//       offset: offset,
//       limit: limit,
//       data: rows.length > 0 ? rows : null,
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const { premium, query } = req.query;

    let whereClause = {
      is_published: true, // ✅ Always fetch only published blogs
    };

    if (premium === "true" || premium === "false") {
      whereClause.premium = premium === "true";
    }

    if (query) {
      whereClause.title = {
        [Op.iLike]: `%${query}%`,
      };
    }

    const { count, rows } = await blogModel.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: bannerImageModel,
          as: "bannerImage",
        },
        {
          model: bannerImageModel,
          as: "featuredImage",
        },
        {
          model: bannerImageModel,
          as: "ogImage",
        },
        {
          model: blogSectionModel,
          as: "sections",
        },
        {
          model: blogCommentModel,
          as: "comments",
          include: [
            {
              model: blogLikeModel,
              as: "likes",
            },
            {
              model: blogReplyModel,
              as: "comment_replies",
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalResults: count,
      nextPage: page < totalPages ? page + 1 : null,
      nextPageUrl:
        page < totalPages
          ? `${process.env.BACKEND_URL}/blogs?page=${page + 1}&limit=${limit}`
          : null,
      previousPageUrl:
        page > 1
          ? `${process.env.BACKEND_URL}/blogs?page=${page - 1}&limit=${limit}`
          : null,
      firstPageUrl: `${process.env.BACKEND_URL}/blogs?page=1&limit=${limit}`,
      lastPageUrl: `${process.env.BACKEND_URL}/blogs?page=${totalPages}&limit=${limit}`,
      offset,
      limit,
      data: rows.length > 0 ? rows : null,
    });
  } catch (error) {
    console.error("getAllBlogs error:", error.message);
    res.status(500).json({ err: error.message });
  }
};


//get specific blog details
const getBlogDetail = async (req, res) => {
  const { id } = req.params;
  //console.log(req.query);
  try {
    const blog = await blogModel.findByPk(id, {
      include: [
        {
          model: userModel,
          foreignKey: "author",
          as: "created_by",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: bannerImageModel,
          foreignKey: "banner_id",
          as: "banner",
        },
        {
          model: bannerImageModel,
          foreignKey: "featured_id",
          as: "featured",
        },
        {
          model: bannerImageModel,
          foreignKey: "og_id",
          as: "og",
        },
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
        {
          model: blogCommentModel,
          foreignKey: "blog_id",
          as: "comments",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "commented_by",
              attributes: {
                exclude: ["password"],
              },
            },
            {
              model: blogLikeModel,
              foreignKey: "comment_id",
              as: "likes",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "liked_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
            {
              model: blogReplyModel,
              foreignKey: "comment_id",
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "replied_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
    });
    const attachments = await bannerImageModel.findAll({
      where: {
        blog_id: id,
      },
    });
    const isBlogSaved = await blogSaveModel.findOne({
      where: {
        blog_id: id,
        user_id: req?.user?.id,
      },
    });
    const isLiked = await blogFavouriteModel.findOne({
      where: {
        blog_id: id,
        user_id: req?.user?.id,
      },
    });
    if (!blog) {
      return res.status(404).json({ err: "Blog notfound" });
    }
    res.json({
      data: blog.dataValues,
      attachments: attachments,
      isSaved: isBlogSaved ? true : false,
      isLiked: isLiked ? true : false,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//create new blog
const createBlog = async (req, res) => {
  //console.log(req);
  
  const {
    title,
    is_published,
    premium,
    short_description,
    top_description,
    bottom_description,
    sections,
    meta_title,
    meta_description,
    meta_keywords
  } = req.body;
  const parseSection = JSON.parse(sections);

  try {
    if (title?.length > 100 || title?.length < 10) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 10 and 100 characters",
      });
    }
    const bannerImage = await bannerImageModel.create({
      path: `/uploads/${req?.files[0]?.filename}`,
      fieldname: req?.files[0]?.fieldname,
      originalname: req?.files[0]?.originalname,
      encoding: req?.files[0]?.encoding,
      mimetype: req?.files[0]?.mimetype,
      destination: req?.files[0]?.destination,
      filename: req?.files[0]?.filename,
      size: req?.files[0]?.size,
    });

    const createBlog = await blogModel.create({
      title: title,
      description: top_description,
      is_published: is_published,
      premium: premium,
      short_description: short_description,
      top_description: top_description,
      bottom_description: bottom_description,
      author: req.user.id,
      banner_id: bannerImage.dataValues.id,
       meta_title: meta_title || title,
      meta_description: meta_description || short_description,
      meta_keywords: meta_keywords || '',
    });

    for (const section of parseSection) {
      try {
        const sectionData = await blogSectionModel.create({
          blog_id: createBlog.dataValues.id,
          heading: section?.heading,
          content: section?.content,
          section_name: section?.heading,
        });
        console.log(sectionData);
      } catch (error) {
        res.status(500).json({ err: error.message });
      }
    }

    res
      .status(200)
      .json({ data: createBlog.dataValues, msg: "Created Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//update existing blog
const updateBlog = async (req, res) => {
  console.log(req);
  
  const {
    title,
    premium,
    short_description,
    is_published,
    top_description,
    bottom_description,
    sections,
  } = req.body;

  const { id } = req.params;
  const parseSection = JSON.parse(sections);

  try {
    if (title?.length > 100 || title?.length < 10) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 10 and 100 characters",
      });
    }

    // Load the existing blog and its sections
    const blog = await blogModel.findByPk(id, {
      include: [
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
      ],
    });

    if (!blog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    const existingSections = blog.sections;

    // Track sections to delete and those already processed
    const sectionsToDelete = [...existingSections];
    const processedSectionIds = [];

    // Iterate over incoming sections to create or update
    for (let i = 0; i < parseSection.length; i++) {
      const section = parseSection[i];

      // Find a matching section in the existing sections by heading or some unique property
      const existingSection = existingSections.find(
        (existing) =>
          existing.heading === section.heading &&
          !processedSectionIds.includes(existing.id)
      );

      if (existingSection) {
        // Update existing section
        await blogSectionModel.update(
          {
            heading: section.heading,
            content: section.content,
            section_name: section.heading,
          },
          {
            where: {
              id: existingSection.id,
            },
          }
        );
        // Mark this section as processed
        processedSectionIds.push(existingSection.id);
        // Remove from deletion list
        sectionsToDelete.splice(sectionsToDelete.indexOf(existingSection), 1);
      } else {
        // Create a new section
        await blogSectionModel.create({
          blog_id: id,
          heading: section.heading,
          content: section.content,
          section_name: section.heading,
        });
      }
    }

    // Delete sections that were not processed (i.e., they are not in the incoming data)
    for (const section of sectionsToDelete) {
      await blogSectionModel.destroy({
        where: {
          id: section.id,
        },
      });
    }

    // Handle file upload and update blog details
    if (req?.files.length > 0) {
      const bannerImage = await bannerImageModel.create({
        path: `/uploads/${req?.files[0]?.filename}`,
        fieldname: req?.files[0]?.fieldname,
        originalname: req?.files[0]?.originalname,
        encoding: req?.files[0]?.encoding,
        mimetype: req?.files[0]?.mimetype,
        destination: req?.files[0]?.destination,
        filename: req?.files[0]?.filename,
        size: req?.files[0]?.size,
      });

      const findBlogs = await blogModel.findAll({
        where: {
          banner_id: blog.dataValues.banner_id,
        },
      });

      if (findBlogs.length === 1) {
        const oldBannerPath = `uploads/${blog?.dataValues?.banner?.path
          ?.split("/")
          ?.pop()}`;
        if (fs.existsSync(oldBannerPath)) {
          try {
            await fs.promises.unlink(oldBannerPath);
            console.log("Deleted successfully");
          } catch (err) {
            return res.json({ err: err.message });
          }
        }
      }

      await blogModel.update(
        {
          title,
          description: top_description,
          short_description,
          is_published,
          premium,
          top_description,
          bottom_description,
          banner_id: bannerImage.dataValues.id,
        },
        {
          where: { id },
        }
      );

      return res.status(200).json({ msg: "Blog updated successfully" });
    }

    // Update the blog details without changing the banner
    await blogModel.update(
      {
        title,
        description: top_description,
        short_description,
        is_published,
        premium,
        top_description,
        bottom_description,
      },
      {
        where: { id },
      }
    );
    res
      .status(200)
      .json({ data: updateBlog.dataValues, msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// Delete existing blog
const deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const findBlog = await blogModel.findOne({
      where: {
        id: id,
      },
      include: [
        {
          model: userModel,
          foreignKey: "author",
          as: "created_by",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: bannerImageModel,
          foreignKey: "banner_id",
          as: "banner",
        },
        {
          model: bannerImageModel,
          foreignKey: "featured_id",
          as: "featured",
        },
        {
          model: bannerImageModel,
          foreignKey: "og_id",
          as: "og",
        },
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
        {
          model: blogCommentModel,
          foreignKey: "blog_id",
          as: "comments",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "commented_by",
              attributes: {
                exclude: ["password"],
              },
            },
            {
              model: blogLikeModel,
              foreignKey: "comment_id",
              as: "likes",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "liked_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
            {
              model: blogReplyModel,
              foreignKey: "comment_id",
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  foreignKey: "user_id",
                  as: "replied_by",
                  attributes: {
                    exclude: ["password"],
                  },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
      ],
    });
    if (!findBlog) {
      return res.status(404).json({ err: "Blog notfound" });
    }

    const findBlogs = await blogModel.findAll({
      where: {
        banner_id: findBlog.dataValues.banner_id,
      },
    });

    if (findBlogs.length == 1) {
      if (
        fs.existsSync(
          `uploads/${findBlog?.dataValues?.banner?.path?.split("/")?.pop()}`
        )
      ) {
        //delete images
        fs.unlink(
          `uploads/${findBlog?.dataValues?.banner?.path?.split("/")?.pop()}`,
          (err) => {
            if (err) {
              return res.json({ err: err.message });
            }
            console.log("Deleted successfully");
          }
        );
      }

      if (!findBlog.dataValues?.title?.startsWith("Draft")) {
        const [banner, featured, og] = await Promise.all([
          bannerImageModel.findByPk(findBlog.dataValues.banner_id),
          bannerImageModel.findByPk(findBlog.dataValues.featured_id),
          bannerImageModel.findByPk(findBlog.dataValues.og_id),
        ]);

        await Promise.all([
          findBlog.destroy(),
          banner?.destroy(),
          featured?.destroy(),
          og?.destroy(),
          blogSectionModel.destroy({
            where: {
              blog_id: findBlog.dataValues.id,
            },
          }),
          blogCommentModel.destroy({
            where: {
              blog_id: findBlog.dataValues.id,
            },
          }),
        ]);
        return res.status(200).json({ msg: "Deleted Successfully" });
      } else {
        findBlog.destroy();
        return res.status(200).json({ msg: "Deleted Successfully" });
      }
    } else {
      await findBlog.destroy();
      return res.status(200).json({ msg: "Deleted Successfully" });
    }

    // fs.unlink(findBlog?.dataValues?.featuredimg?.path?.split("/")[1], (err) => {
    //   if (err) {
    //     return res.json({ err: err.message });
    //   }
    //   console.log("Deleted successfully");
    // });
    // fs.unlink(findBlog?.dataValues?.ogimg?.path?.split("/")[1], (err) => {
    //   if (err) {
    //     return res.json({ err: err.message });
    //   }
    //   console.log("Deleted successfully");
    // });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createComment = async (req, res) => {
  const { comment } = req.body;
  const { id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    const addComment = await blogCommentModel.create({
      comment,
      user_id: req.user?.id,
      blog_id: id,
    });

    const fullComment = await blogCommentModel.findByPk(addComment.id, {
      include: [
        {
          model: userModel,
          as: 'commented_by', // 👈 MUST match your alias exactly
          attributes: ['id', 'name', 'email'], // Add 'profile_image' if needed
        },
      ],
    });

    return res.status(200).json(fullComment);
  } catch (error) {
    return res.status(500).json({ err: error.message });
  }
};

const updateComment = async (req, res) => {
  const { comment_id, id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(id);

    if (!findBlog) {
      return res.status(404).json({ err: "Blog not-found" });
    }
    const findComment = await blogCommentModel.findOne({
      id: comment_id,
      blog_id: id,
      user_id: req.user?.id,
    });

    if (!findComment) {
      return res.status(404).json({ err: "Comment not-found" });
    }
    console.log(req.body);

    await blogCommentModel.update(req.body, {
      where: {
        id: comment_id,
        blog_id: id,
        user_id: req?.user?.id,
      },
    });

    res.status(200).json({ msg: "Comment Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getCommentById = async (req, res) => {
  const { comment_id } = req.params;

  try {
    const findComment = await blogCommentModel.findOne({
      where: { id: comment_id },
      include: [
        {
          model: userModel,
          as: "commented_by",
          attributes: ["id", "name", "email"],
        },
        {
          model: blogModel,
          as: "blog",
          attributes: ["id", "title", "slug"],
        },
      ],
    });

    if (!findComment) {
      return res.status(404).json({ err: "Comment not found" });
    }

    res.status(200).json({ data: findComment });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteComment = async (req, res) => {
  const { comment_id, id } = req.params;
  try {
    const findBlog = await blogModel.findByPk(id);

    if (!findBlog) {
      return res.status(404).json({ err: "Blog not-found" });
    }
    const findComment = await blogCommentModel.findOne({
      where: {
        id: comment_id,
        blog_id: id,
        user_id: req.user?.id,
      },
    });

    if (!findComment) {
      return res.status(404).json({ err: "Comment not-found" });
    }

    await findComment.destroy();

    res.status(200).json({ msg: "Comment Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//blog like controller

const createLike = async (req, res) => {
  const { comment_id } = req.params;
  try {
    // Check if already liked
    const alreadyLiked = await blogLikeModel.findOne({
      where: {
        comment_id,
        user_id: req.user.id,
      },
    });

    if (alreadyLiked) {
      return res.status(400).json({ err: "Already Liked" });
    }

    // Create new like
    const newLike = await blogLikeModel.create({
      comment_id,
      user_id: req.user.id,
    });

    // Fetch the created like with user data using the correct alias
    const createdLike = await blogLikeModel.findByPk(newLike.id, {
      include: [{
        model: userModel,
        as: 'liked_by',  // Must match your association alias
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({ 
      message: "Liked successfully",
      data: createdLike 
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

// Unlike Controller
const deleteLike = async (req, res) => {
  const { like_id } = req.params;
  try {
    const findLike = await blogLikeModel.findOne({
      where: {
        id: like_id,
        user_id: req.user.id,
      },
    });

    if (!findLike) {
      return res.status(404).json({ err: "Like not found" });
    }

    await findLike.destroy();
    res.status(200).json({ 
      message: "Unliked successfully",
      deletedLikeId: like_id 
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//blog reply controller

// const getReplies = async (req, res) => {
//   const { comment_id } = req.params;
//   try {
//     const findComment = await blogCommentModel.findByPk(comment_id);
//     if (!findComment) {
//       return res.status(404).json({ err: "comment not-found" });
//     }
//     const replies = await blogReplyModel.findAll({
//       where: {
//         comment_id: comment_id,
//       },
//     });
//     res.status(200).json({ data: replies });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };
const getReplies = async (req, res) => {
  const { comment_id } = req.params;
  try {
    const findComment = await blogCommentModel.findByPk(comment_id);
    if (!findComment) {
      return res.status(404).json({ err: "comment not-found" });
    }

    const replies = await blogReplyModel.findAll({
      where: { comment_id },
      include: [
        {
          model: userModel,
          as: "replied_by",
          attributes: ["id", "name", "email"], // Add or remove fields as needed
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.status(200).json({ data: replies });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createReply = async (req, res) => {
  const { comment_id } = req.params;
  const { reply } = req.body;
  try {
    const findComment = await blogCommentModel.findByPk(comment_id);
    if (!findComment) {
      return res.status(404).json({ err: "Comment not-found" });
    }
    const newReply = await blogReplyModel.create({
      reply: reply,
      comment_id: comment_id,
      user_id: req?.user?.id,
    });

    // Fetch the newly created reply with all associations
    const createdReply = await blogReplyModel.findByPk(newReply.id, {
      include: [
        {
          model: userModel, // Assuming you have a user model
          as: 'replied_by', // or whatever your association is called
          attributes: ['id', 'name'] // Only include necessary fields
        }
      ]
    });

   res.status(201).json({ 
      message: "Reply created successfully",
      data: createdReply 
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateReply = async (req, res) => {
  const { reply_id } = req.params;
  try {
    const findReply = await blogReplyModel.findByPk(reply_id);
    if (!findReply) {
      return res.status(404).json({ err: "Reply not-found" });
    }
    const updateReply = await blogReplyModel.update(req.body, {
      where: {
        id: reply_id,
      },
    });

    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteReply = async (req, res) => {
  const { reply_id } = req.params;
  try {
    const findReply = await blogReplyModel.findByPk(reply_id);
    if (!findReply) {
      return res.status(404).json({ err: "Reply not-found" });
    }
    await findReply.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getAllSavedBlogs = async (req, res) => {
  try {
    const findAllBlogs = await blogSaveModel.findAll({
      where: {
        user_id: req?.user?.id,
      },
      include: [
        {
          model: blogModel,
          foreignKey: "blog_id",
          as: "saves",
          include: [
            {
              model: userModel,
              foreignKey: "user_id",
              as: "creator",
              attributes: {
                exclude: ["password"],
              },
            },
          ],
        },
      ],
    });
    res.status(200).json({ data: findAllBlogs });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const createBookmark = async (req, res) => {
  const { id } = req.params;
  try {
    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    const alreadySaved = await blogSaveModel.findOne({
      where: {
        blog_id: id,
        user_id: req?.user?.id,
      },
    });

    if (alreadySaved) {
      return res.status(400).json({ err: "Already Bookmarked" });
    }

    const createSave = await blogSaveModel.create({
      blog_id: id,
      user_id: req?.user?.id,
    });

    res.status(201).json({ msg: "Bookmarked successfully", data: createSave });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    res.status(500).json({ err: "Failed to bookmark blog post" });
  }
};

const deleteBookmark = async (req, res) => {
  const { id, save_id } = req.params;
  try {
    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    const save = await blogSaveModel.findOne({
      where: {
        id: save_id,
        blog_id: id,
        user_id: req?.user?.id,
      },
    });

    if (!save) {
      return res.status(404).json({ err: "Bookmark not found" });
    }

    await save.destroy();
    res.status(200).json({ msg: "Unbookmarked successfully" });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    res.status(500).json({ err: "Failed to unbookmark blog post" });
  }
};

const createSaveBlog = async (req, res) => {
  const { blog_id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(blog_id);

    if (!findBlog) {
      return res.status(404).json({ err: "Blog not-found" });
    }

    const alreadySaved = await blogSaveModel.findOne({
      where: {
        blog_id: blog_id,
        user_id: req?.user?.id,
      },
    });

    if (alreadySaved) {
      return res.status(400).json({ err: "Already Saved" });
    }

    const createSave = await blogSaveModel.create({
      blog_id: blog_id,
      user_id: req?.user?.id,
    });
    res.status(201).json({ msg: "Saved Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteSavedBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const findSavedBlog = await blogSaveModel.findByPk(id);

    if (!findSavedBlog) {
      return res.status(404).json({ err: "Saved Blog not-found" });
    }

    await findSavedBlog.destroy();

    res.status(201).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//blog favourite
const createFavourite = async (req, res) => {
  const { id } = req.params;
  try {
    const alreadyLiked = await blogFavouriteModel.findOne({
      where: {
        blog_id: id,
        user_id: req?.user?.id,
      },
    });

    if (alreadyLiked) {
      return res.status(400).json({ err: "Already Liked" });
    }

    const createLike = await blogFavouriteModel.create({
      blog_id: id,
      user_id: req?.user?.id,
    });

    res.status(201).json({ msg: "Favorited successfully", data: createLike });
  } catch (error) {
    console.error("Error creating favorite:", error);
    res.status(500).json({ err: "Failed to favorite blog post" });
  }
};

const deleteFavourite = async (req, res) => {
  const { id, favourite_id } = req.params;
  try {
    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    const favourite = await blogFavouriteModel.findOne({
      where: {
        id: favourite_id,
        blog_id: id,
        user_id: req?.user?.id,
      },
    });

    if (!favourite) {
      return res.status(404).json({ err: "Favorite not found" });
    }

    await favourite.destroy();
    res.status(200).json({ msg: "Unfavorited successfully" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ err: "Failed to unfavorite blog post" });
  }
};

// const getBlogCategories = async (req, res) => {
//   try {
//     const blogCategories = await blogCategoryModel.findAll({});
//     res.render("category/index", {
//       data: blogCategories,
//       title: "Category List",
//       query: {},
//     });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getBlogCategories = async (req, res) => {
  try {
    const blogCategories = await blogCategoryModel.findAll({});
    res.json(blogCategories); // Send JSON instead of rendering EJS
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const getBlogCategory = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const findBlogCategory = await blogCategoryModel.findByPk(id);
//     if (!findBlogCategory) {
//       return res.status(404).json({ err: "Category not-found" });
//     }
//     res.render("category/update", { data: findBlogCategory.dataValues });
//     // res.status(200).json({ data: findBlogCategory.dataValues });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const getBlogCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const findBlogCategory = await blogCategoryModel.findByPk(id);
    if (!findBlogCategory) {
      return res.status(404).json({ err: "Category not found" });
    }

    res.status(200).json({ data: findBlogCategory.dataValues }); // Send JSON instead of rendering EJS
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getBlogSpecificCategory = async (req, res) => {
  const { blog_id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(blog_id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not-found" });
    }
    const findCategory = await blogModel.findAll({
      where: {
        id: blog_id,
      },
      include: [
        {
          model: blogCategoryModel,
          through: {
            attributes: [],
          },
        },
      ],
    });
    res.status(200).json({ data: findCategory });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ err: error.message });
  }
};

//15/july/2025 updated the create category

// Function to create a new blog with a default category
const createBlogWithCategory = async (req, res) => {
  const { title, content, categoryId } = req.body;

  try {
    // First create the blog
    const newBlog = await blogModel.create({
      title,
      content
      // other blog fields
    });

    // Then create the category mapping
    await blogCategoryMapModel.create({
      blog_id: newBlog.id,
      category_id: categoryId
    });

    res.status(201).json({ 
      msg: "Blog created with category successfully",
      blog: newBlog
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ err: error.message });
  }
};

// Your existing function for adding categories to existing blogs
const createBlogSpecificCategory = async (req, res) => {
  const { blog_id } = req.params;
  const { categoryId } = req.body;

  try {
    const findBlog = await blogModel.findByPk(blog_id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not-found" });
    }

    const findBlogSpecificCategory = await blogCategoryMapModel.findOne({
      where: {
        blog_id: blog_id,
        category_id: categoryId,
      },
    });

    if (findBlogSpecificCategory) {
      return res.status(400).json({ msg: "Already Exist" });
    }

    await blogCategoryMapModel.create({
      blog_id: blog_id,
      category_id: categoryId,
    });
    res.status(201).json({ msg: "Category added to blog successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ err: error.message });
  }
};

// const createBlogSpecificCategory = async (req, res) => {
//   const { blog_id } = req.params;
//   const { category_ids } = req.body; // expects an array

//   try {
//     const findBlog = await blogModel.findByPk(blog_id);
//     if (!findBlog) {
//       return res.status(404).json({ err: "Blog not-found" });
//     }

//     if (!Array.isArray(category_ids)) {
//       return res.status(400).json({ err: "Invalid category list" });
//     }

//     const created = [];

//     for (const categoryId of category_ids) {
//       const exists = await blogCategoryMapModel.findOne({
//         where: {
//           blog_id: blog_id,
//           category_id: categoryId,
//         },
//       });

//       if (!exists) {
//         await blogCategoryMapModel.create({
//           blog_id: blog_id,
//           category_id: categoryId,
//         });
//         created.push(categoryId);
//       }
//     }

//     res.status(201).json({
//       msg: "Categories mapped successfully",
//       added: created,
//     });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ err: error.message });
//   }
// };

const deleteBlogSpecificCategory = async (req, res) => {
  const { blog_id } = req.params;
  const { categoryId } = req.body;

  try {
    const findBlogCategoryMap = await blogCategoryMapModel.findOne({
      where: {
        blog_id: blog_id,
        category_id: categoryId,
      },
    });
    if (!findBlogCategoryMap) {
      return res.status(404).json({ err: "Blog Specific Category not-found" });
    }
    await findBlogCategoryMap.destroy();

    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ err: error.message });
  }
};

// const createBlogCategory = async (req, res) => {
//   const { title, description, name } = req.body;
//   try {
//     const createCategory = await blogCategoryModel.create({
//       title,
//       description,
//       name,
//       slug: slugify(title, {
//         replacement: "-",
//         remove: undefined,
//         lower: false,
//         strict: false,
//         trim: true,
//       }),
//       meta_title: title,
//       meta_description: description,
//     });

//     res.status(201).json({ msg: "Category Created Successfully" });
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const createBlogCategory = async (req, res) => {
  const { title, description, name, meta_title, meta_description } = req.body;

  try {
    const createCategory = await blogCategoryModel.create({
      id: crypto.randomUUID(), // Generate unique ID
      title,
      description,
      name,
      slug: slugify(title, {
        replacement: "-",
        lower: true,
        strict: true,
        trim: true,
      }),
      meta_title,
      meta_description,
      status: 0, // Default status: Not Reviewed
    });

    res.status(201).json({
      msg: "Category Created Successfully",
      category: createCategory,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateBlogCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const findBlogCategory = await blogCategoryModel.findByPk(id);
    if (!findBlogCategory) {
      return res.status(404).json({ err: "Category not-found" });
    }
    await blogCategoryModel.update(
      {
        title: req?.body.title,
        description: req?.body?.description,
        name: req?.body.name,
        slug: slugify(req?.body?.title, {
          replacement: "-",
          remove: undefined,
          lower: false,
          strict: false,
          trim: true,
        }),
        meta_title: req?.body.meta_title,
        meta_description: req?.body?.description,
      },
      {
        where: {
          id: id,
        },
      }
    );
    res.status(200).json({ msg: "Update Category Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteBlogCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const findBlogCategory = await blogCategoryModel.findByPk(id);
    if (!findBlogCategory) {
      return res.status(404).json({ err: "Category not-found" });
    }
    await findBlogCategory.destroy();
    res.status(200).json({ msg: "Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const blog = await blogModel.findOne({
      where: { slug },
      include: [
        
        {
          model: userModel,
          as: "creator", // must match association
          attributes: { exclude: ["password"] },
        },
        {
          model: authorModel,
          as: "blogAuthor",
          required: false,
        },
        {
          model: bannerImageModel,
          as: "bannerImage", // must match association
        },
        {
          model: bannerImageModel,
          as: "featuredImage", // must match association
        },
        {
          model: bannerImageModel,
          as: "ogImage", // must match association
        },
        {
          model: blogSectionModel,
          as: "sections",
        },
        {
          model: blogFavouriteModel,
          as: "favourite",
          // where: { user_id: req?.user?.id || null },
          // required: false, // Left join to include blogs even if no favorite exists
 attributes: ["id","user_id"], // Only fetch the ID for efficiency
        },
        
        {
          model: blogCommentModel,
          as: "comments",
          include: [
            {
              model: userModel,
              as: "commented_by",
              attributes: { exclude: ["password"] },
            },
            {
              model: blogLikeModel,
              as: "likes",
              include: [
                {
                  model: userModel,
                  as: "liked_by",
                  attributes: { exclude: ["password"] },
                },
              ],
            },
            {
              model: blogReplyModel,
              as: "comment_replies",
              include: [
                {
                  model: userModel,
                  as: "replied_by",
                  attributes: { exclude: ["password"] },
                },
              ],
            },
          ],
          separate: true,
          order: [["createdAt", "DESC"]],
        },
        {
          model: blogCategoryModel,
          as: "blog_categories", // Must match your Sequelize association alias
          through: { attributes: ["type"] }, // Include mapping table fields if needed
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    // if (!blog) {
    //   return res.status(404).json({ err: "Blog not found" });
    // }

    // const attachments = await bannerImageModel.findAll({
    //   where: { blog_id: blog.id },
    // });

    // const isBlogSaved = await blogSaveModel.findOne({
    //   where: {
    //     blog_id: blog.id,
    //     user_id: req?.user?.id,
    //   },
    // });

    // const isLiked = await blogFavouriteModel.findOne({
    //   where: {
    //     blog_id: blog.id,
    //     user_id: req?.user?.id,
    //   },
    // });

    // res.json({
    //   data: blog.dataValues,
    //   attachments,
    //   isSaved: !!isBlogSaved,
    //   isLiked: !!isLiked,
    // });

    if (!blog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    // Calculate total likes
    const likesCount = await blogFavouriteModel.count({
      where: { blog_id: blog.id },
    });

    // Check if the blog is saved/bookmarked
    const isBlogSaved = await blogSaveModel.findOne({
      where: {
        blog_id: blog.id,
        user_id: req?.user?.id || null,
      },
    });

    // Prepare response
    const blogData = blog.toJSON();
    const isLiked = blog.favourite && blog.favourite.length > 0;
    const favouriteId = isLiked ? blog.favourite[0].id : null;

    res.status(200).json({
      data: {
        ...blogData,
        likes: likesCount,
        isLiked,
        favouriteId,
        isSaved: !!isBlogSaved,
      },
    });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ err: error.message });
  }
};

const getFeaturedBlogs = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: featuredBlogs } = await blogModel.findAndCountAll({
      where: { 
        type: "featured",
        is_published: true // Only get published featured blogs
      },
      include: [
        {
          model: bannerImageModel,
          as: "bannerImage",
          attributes: ['id', 'path']
        },
        {
          model: authorModel,
          as: "blogAuthor",
          attributes: ['id', 'name']
        },
        {
          model: blogSectionModel,
          as: "sections",
          attributes: ['id', 'heading']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { 
        exclude: ['updatedAt'] // Exclude unnecessary fields
      }
    });

    res.status(200).json({
      success: true,
      data: featuredBlogs,
      // pagination: {
      //   total: count,
      //   pages: Math.ceil(count / limit),
      //   currentPage: parseInt(page),
      //   perPage: parseInt(limit)
      // }
    });

  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch featured blogs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createUser = async (req, res) => {
  const { email, name, password, bio, phone } = req.body;
  const phonePattern = /^[0-9]{10}$/;

  try {
    // Validate email format and length
   
    if (!emailValidator.validate(email) || email.length > 50 || email.length < 12) {
      return res.status(400).json({
        type: "email",
        err: "Please enter a valid email (12–50 characters)",
      });
    }

    // Check if the email already exists
    const existingUser = await userModel.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        type: "email",
        err: "This email is already registered",
      });
    }

    // Validate phone number if provided
    if (phone && !phonePattern.test(phone)) {
      return res.status(400).json({
        type: "phone",
        err: "Please enter a valid 10-digit phone number",
      });
    }

    // Validate password
    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({
        type: "password",
        err: "Password must be 6–20 characters long",
      });
    }
    if (passwordStrength(password).id < 2) {
      return res.status(400).json({
        type: "password",
        err: "Password must be stronger (include letters, numbers, symbols)",
      });
    }

    // Validate bio length
    if (bio && bio.length > 70) {
      return res.status(400).json({
        type: "bio",
        err: "Bio must be under 70 characters",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with default 'user' role
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      bio: bio || null,
      phone: phone || null,
      role: "user", // Set role explicitly for public user
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.dataValues.id },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: '7d' } // Optional: token expiration
    );

    res.status(201).json({
      msg: "Registration successful!",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        bio: newUser.bio,
        phone: newUser.phone,
      },
      token,
    });

  } catch (err) {
    console.error("User registration error:", err);
    res.status(500).json({ err: "Server error. Please try again later." });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.user?.id; // assuming user ID is attached via middleware after JWT verification

    const user = await userModel.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'bio', 'phone', 'role'],
    });

    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ err: "Server error. Please try again later." });
  }
};

const updateUser = async (req, res) => {
  const { name, phone, bio, currentPassword, newPassword } = req.body;

  try {
    const userId = req.user?.id;
    const user = await userModel.findByPk(userId);

    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    const updates = {};

    // Update name
    if (name && name.trim().length > 0) {
      updates.name = name.trim();
    }

    // Update phone
    if (phone) {
      const cleanedPhone = phone.trim();
      if (!/^\d{10}$/.test(cleanedPhone)) {
        return res.status(400).json({ type: "phone", err: "Invalid phone number" });
      }
      updates.phone = cleanedPhone;
    }

    // Update bio
    if (bio !== undefined) {
      updates.bio = bio.trim();
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ type: "currentPassword", err: "Current password is required" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ type: "currentPassword", err: "Current password is incorrect" });
      }

      if (newPassword.length < 6 || newPassword.length > 20) {
        return res.status(400).json({ type: "password", err: "Password must be 6–20 characters long" });
      }

      if (passwordStrength(newPassword).id < 2) {
        return res.status(400).json({
          type: "password",
          err: "Password must be stronger (include letters, numbers, symbols)",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      updates.password = hashed;
    }

    // Save updates
    await user.update(updates);

    res.status(200).json({ msg: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ err: "Server error. Please try again later." });
  }
};

const getPageDetails = async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ error: "Slug is required" });
  }

  try {
    const findPage = await pageModel.findOne({
      where: { slug },
      include: [
        {
          model: pageSectionModel,
          as: "page_sections",
        },
      ],
    });

    if (!findPage) {
      return res.status(404).json({ error: "Page not found" });
    }

    if (req.query.publish !== undefined) {
      const newStatus = req.query.publish === "true";
      await pageModel.update(
        { is_published: newStatus },
        { where: { slug } }
      );
      return res.json({ message: "Page publish status updated" });
    }

    res.json({
      data: findPage,
      title: "Update Page",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBlogs,
  getBlogDetail,
  createBlog,
  updateBlog,
  deleteBlog,
  updateComment,
  createComment,
  deleteComment,
  getCommentById,
  createLike,
  deleteLike,
  getReplies,
  createReply,
  updateReply,
  deleteReply,
  getAllSavedBlogs,
  createSaveBlog,
  deleteSavedBlog,
  createFavourite,
  deleteFavourite,
  getBlogCategories,
  getBlogCategory,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogSpecificCategory,
  createBlogSpecificCategory,
  createBlogWithCategory,
  deleteBlogSpecificCategory,
  getBlogBySlug,createBookmark,deleteBookmark,getFeaturedBlogs,createUser,updateUser,getUser,getPageDetails
};
