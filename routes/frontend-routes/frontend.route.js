const express = require("express");
const router = express.Router();
const {
  staticPageController,
} = require("../../controller/static-page.controller");
const {
  getAllItems,
  getItemById,
} = require("../../controller/listItem.controller");
const { getAllMenus } = require("../../controller/MenuController");
const { getSettingsNew } = require("../../controller/Settings");
const {
  getAllBlogs,
  getBlogDetail,
  getUpdateBlog,
} = require("../../controller/admin.controller");

const authorController = require("../../controller/author.controller");

router.get("/staticpage", staticPageController.getAllStaticPages);
router.get("/staticpage/:slug", staticPageController.getStaticPageDetails);

router.get("/list-items/:listId/entries/:id", getItemById);
router.get("/list-items/:listId/entries", getAllItems);
router.get("/new/menu", getAllMenus);
router.get("/new/setting", getSettingsNew);

router.get("/new/blogs", getAllBlogs);
router.get("/new/blogs/:id", getUpdateBlog);

router.get("/author/:id", authorController.getAuthorById);

module.exports = router;
