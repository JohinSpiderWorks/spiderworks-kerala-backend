const bannerImageModel = require("../../models/bannerImage.model");
const blogModel = require("../../models/blog.model");
const blogCategoryModel = require("../../models/blogCategory.model");
const blogCategoryMapModel = require("../../models/blogCategoryMap.model");
const blogCommentModel = require("../../models/blogComment.model");
const blogSectionModel = require("../../models/blogSection.model");

const getAllCategory = async (req, res) => {
  try {
    const categories = await blogCategoryModel.findAll({});
    res.status(200).json({ data: categories });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getCategoryBasedBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const findCategoryBlog = await blogCategoryModel.findOne({
      where: {
        id,
      },
      include: [
        {
          model: blogModel,
          foreignKey: "category_id",
          as: "blogs",
          through: {
            attributes: [],
          },
          include: [
            {
              model: bannerImageModel,
              foreignKey: "banner_id",
              as: "banner",
            },
            {
              model: blogCommentModel,
              foreignKey: "comment_id",
              as: "comments",
            },
            {
              model: blogSectionModel,
              foreignKey: "section_id",
              as: "sections",
            },
          ],
        },
      ],
    });
    if (!findCategoryBlog) {
      return res.status(404).json({ err: "Category not-found" });
    }
  

    res.status(200).json({ data: findCategoryBlog.dataValues });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = { getAllCategory, getCategoryBasedBlog };
