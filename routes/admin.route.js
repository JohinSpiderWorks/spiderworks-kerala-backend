const express = require("express");
const blogModel = require("../models/blog.model");
const uploader = require("../middleware/uploadMiddleware");
const mediaController = require("../controller/mediaController");
const {
  getAllUsers,
  createUser,
  getPersonalDetails,
  getPersonBlogs,
  getPersonForums,
} = require("../controller/user.controller");
const { adminAuth } = require("../middleware/auth.middleware");
const {
  getLogFiles,
  readLogFile,
  deleteLogFile,
  deleteAllLogs,
} = require("../controller/logs.controller");
const {
  login,
  createAdmin,
  getAllBlogs,
  deleteBlog,
  deleteUser,
  dashboard,
  createBlog,
  getUpdateBlog,
  updateBlog,
  getUpdateUser,
  updateUser,
  duplicateBlog,
  getBlogDetail,
  getCommentById,
  getAllComments,
  getComments,
  deleteComment,
  postComment,
  updateComment,
  updateBlogAttributes,
  verifyOtp,
  updateBlogMetadata,
  searchUser,
  searchBlogs,
  logout,
  updateReply,
  deleteReply,
  createReply
} = require("../controller/admin.controller");
const multer = require("multer");

const {
  uploadGalleryMedia,
  fetchGalleryMedia,
  deleteGalleryMedia,
  createGalleryFolder,
  fetchGalleryFolders,
  moveGalleryMedia,
  fetchFolderMedia,
  deleteGalleryFolder,
  renameGalleryFolder,
  fetchAllMedias,
} = require("../controller/galleryController");

const authorController = require("../controller/author.controller");

const {
  createMenu,
  getAllMenus,
  getSingleMenu,
  updateMenu,
  deleteMenu,
} = require("../controller/MenuController");

const {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandBySlug,
  searchBrands,
  updateBrand,
} = require("../controller/brand.controller");

const {
  addOrUpdateSettings,
  getSettingsNew,
  updateSection,
  createSocialMediaPlatform,
  getSocialMediaPlatforms,
  uploadLinkLogo,
  createSocialMediaLink,
  getAllSocialMediaLinks,
  updateSocialMediaLink,
  deleteSocialMediaLink,
} = require("../controller/Settings");

const {
  AllFooterDesktop,
  AllFooterMobile,
  AllMainDesktop,
  AllMainMobile,
  createFooterDesktop,
  createFooterMobile,
  createMainDesktop,
  createMainMobile,
  deleteFooterDesktop,
  deleteFooterMobile,
  deleteMainDesktop,
  deleteMainMobile,
  updateFooterDesktop,
  updateFooterMobile,
  updateMainDesktop,
  updateMainMobile,
  getMainDesktopChild,
  getFooterDesktopDetail,
  getFooterMobileDetail,
  getMainMobileDetail,
} = require("../controller/menu.controller");

const checkFileType = require("../utils/checkFileType");
const userModel = require("../models/user.model");
const {
  getAllForums,
  createForum,
  getUpdateForum,
  updateForum,
  deleteForum,
  updateForumStatus,
  updateSingleForum,
} = require("../controller/forum.controller");
const {
  getAllJobs,
  updateJob,
  createJob,
  deleteJob,
  getUpdateJob,
  toggleJobActiveStatus,
} = require("../controller/career.controller");
const {
  getAllServices,
  createService,
  updateService,
  deleteService,
  getUpdateService,
  duplicateService,
  toggleServiceStatus,
  updateServiceMeta,
} = require("../controller/service.controller");
const { addNewBlogs, getDetails } = require("../controller/import.controller");
const {
  getAllSettings,
  getSettings,
  createSettings,
  updateSettings,
} = require("../controller/settings.controller");

const {
  createPage,
  deletePage,
  getAllPages,
  updatePage,
  getPageDetails,
  togglePagePublishStatus,
  updateMetaData,
} = require("../controller/page.controller");
const {
  getAllNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  createNotification,
} = require("../controller/notification.controller");
const {
  getRobotTxt,
  createRobotTxt,
} = require("../controller/robot.controller");
const {
  getAllRedirects,
  createRedirect,
  getRedirect,
  updateRedirect,
  deleteRedirect,
} = require("../controller/redirect.controller");
const {
  getBlogCategories,
  getBlogCategory,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogSpecificCategory,
  createBlogWithCategory,
  createBlogSpecificCategory,
  deleteBlogSpecificCategory,
} = require("../controller/blog.controller");
const blogCategoryModel = require("../models/blogCategory.model");
const {
  getAllStaticPages,
  getStaticPageDetails,
  updateStaticPage,
  deleteStaticPage,
} = require("../controller/staticpage.controller");

const productController = require("../controller/productController");
const {
  getAllEvents,
  createEvent,
  getSingleEvent,
  updateEvent,
  deleteEvent,
} = require("../controller/EventsController");
const {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} = require("../controller/testimonilasController");
const {
  staticPageController,
} = require("../controller/static-page.controller");
const {
  getAllCategories,
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  updateCategory,
  addNewOption,
  deleteOption,
  updateOption,
  getAllOptions,
} = require("../controller/category.controller");
const {
  getAllStockHistory,
  getStockHistoryById,
  getStockHistoryByProductId,
  getOutOfStockVariants,
} = require("../controller/stock-history.controller");
const {
  createListItem,
  updateListItem,
  deleteListItem,
  getAllListItems,
  getListItemById,
} = require("../controller/list.controller");
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controller/listItem.controller");
const {
  serviceDetailsController,
} = require("../controller/service_details.controller");

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, (error, isValid, jsonError) => {
      if (isValid) {
        cb(null, true);
      } else {
        cb(error);
      }
    });
  },
});

const blogImageUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, (error, isValid, jsonError) => {
      if (isValid) {
        cb(null, true);
      } else {
        cb(error);
      }
    });
  },
});

const router = express.Router();
router.get("/create", async (req, res) => {
  // const findAdmin = await userModel.findOne({
  //   where: {
  //     role: "admin",
  //   },
  // });

  if (null) {
    res.redirect("/admin/login");
  } else {
    res.render("create", { title: "Create" });
  }
});
router.post("/create", createAdmin);

router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/logout", logout);


 router.use(adminAuth);
router.get("/dashboard", dashboard);
router.get("/dashboard/blogs/create", async (req, res) => {
  const categories = await blogCategoryModel.findAll({});
  res.render("createblog", { title: "Create Blog", categories: categories });
});

//router.put("/dashboard/blogs/update/:id", upload.array("image", 3), updateBlog);
router.put("/dashboard/blogs/update/:id", upload.single("image"), updateBlog);
// router.post("/dashboard/blogs/create", upload.array("image", 3), createBlog);
router.post("/dashboard/blogs/create", upload.single("image"), createBlog);

// Add this new route for image uploads
router.post("/upload-image", blogImageUpload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    url: `/uploads/${req.file.filename}`,
    path: req.file.path,
    filename: req.file.filename,
  });
});

router.get("/dashboard/blogs", getAllBlogs);
router.get("/sitemap-blogs.xml", async (req, res) => {
  try {
    const blogs = await blogModel.findAll({
      attributes: ["slug", "updatedAt"], // Fetch only slug & last updated date
      where: { premium: false }, // Only non-premium blogs should be indexed
      order: [["createdAt", "DESC"]],
    });

    if (!blogs.length) {
      return res.status(404).send("No blogs found");
    }

    const baseUrl = "https://yourwebsite.com/blogs"; // Change this to your actual URL
    const lastMod = new Date().toISOString();

    // Generate XML sitemap
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${blogs
        .map(
          (blog) => `
        <url>
          <loc>${baseUrl}/${blog.slug}</loc>
          <lastmod>${blog.updatedAt.toISOString()}</lastmod>
          <priority>0.8</priority>
        </url>`
        )
        .join("\n")}
    </urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemapXml);
  } catch (error) {
    res.status(500).send("Error generating sitemap: " + error.message);
  }
});
router.get("/dashboard/blogs/search", searchBlogs);
//router.get("/dashboard/blogs/:id", getBlogDetail);
router.get("/dashboard/blogs/update/:id", getUpdateBlog);
router.delete("/dashboard/blogs/delete/:id", deleteBlog);
router.put("/dashboard/blogsattribute/update/:blogId", updateBlogAttributes);
router.put("/blogs/:id/meta", updateBlogMetadata);
router.get("/dashboard/blogs/duplicate/:id", duplicateBlog);
router.get("/dashboard/blog/comments/:comment_id", getCommentById);
router.get("/dashboard/blogs/comments/get", getAllComments);
router.get("/dashboard/blogs/comments/get/:id", getComments);
router.post("/dashboard/blog/:id/comments", postComment);
router.delete("/dashboard/blog/:id/comments/:comment_id/delete", deleteComment);
router.put("/dashboard/blog/:id/comments/:comment_id", updateComment);

//rely
router.put("/dashboard/blogs/:id/comments/:comment_id/reply/:reply_id", updateReply);
router.delete("/dashboard/blogs/:id/comments/:comment_id/reply/:reply_id", deleteReply);
router.post("/dashboard/blogs/:id/comments/:comment_id/reply", createReply);

router.get("/users", getAllUsers);
router.post("/users/create", createUser);
//router.get("/dashboard/user/delete/:id", deleteUser);
router.delete("/dashboard/user/delete/:id", deleteUser);
router.get("/dashboard/user/update/:id", getUpdateUser);
router.put("/dashboard/user/update/:id", updateUser);
router.get("/dashboard/user/create", (req, res) => {
  res.render("createuser", { title: "Create User" });
});
router.get("/dashboard/search", searchUser);

router.get("/category", getBlogCategories);
router.get("/category/create", (req, res) => {
  res.render("category/create", { title: "Create New Category" });
});
router.get("/category/:id", getBlogCategory);
router.get("/category/blog/:blog_id", getBlogSpecificCategory);
router.post('/blogs', createBlogWithCategory);
router.post("/category/blog/:blog_id", createBlogSpecificCategory);
router.delete("/category/blog/:blog_id", deleteBlogSpecificCategory);
router.post("/category", createBlogCategory);
router.put("/category/:id", updateBlogCategory);
router.delete("/category/:id", deleteBlogCategory);

// forums
router.get("/dashboard/forums", getAllForums);
router.get("/dashboard/forums/create", (req, res) => {
  res.render("forum/createforum", { title: "Create Forum" });
});
router.post("/dashboard/forums/create", upload.array("image", 3), createForum);
router.get("/dashboard/forums/update/:id", getUpdateForum);
router.put(
  "/dashboard/forums/update/:id",
  upload.array("image", 3),
  updateForum
);
router.put("/dashboard/forum/update/:id", updateSingleForum);

router.put("/dashboard/update/forums/status/:id", updateForumStatus);

router.get("/dashboard/forums/delete/:id", deleteForum);

//career routes
router.get("/career", getAllJobs);
router.get("/career/create", (req, res) => {
  res.render("career/create", { title: "Create Job" });
});
router.post("/career/create", createJob);
router.get("/career/:id", getUpdateJob);
router.put("/career/:id", updateJob);
router.put("/career/update/toggle-active", toggleJobActiveStatus);
//router.get("/career/:id/delete", deleteJob);
// Change from GET to DELETE for delete operation
router.delete("/career/:id/delete", deleteJob);

//service routes
router.get("/services", getAllServices);
router.get("/services/create", (req, res) => {
  res.render("service/create", { title: "Create Service" });
});
router.post("/services/create", createService);
router.get("/services/:id/update", getUpdateService);
router.put("/services/:id/update", updateService);
router.patch("/services/update/:id/toggle-status", toggleServiceStatus);
//router.get("/services/:id/delete", deleteService);
router.delete("/services/:id", deleteService);
router.put("/services/update/:id/meta", updateServiceMeta);
router.get("/services/duplicate/:id", duplicateService);

//gallery
router.post("/upload/gallery", uploadGalleryMedia);
router.get("/upload/gallery", fetchGalleryMedia);
router.delete("/gallery/:id", deleteGalleryMedia);
router.post("/gallery/folders", createGalleryFolder);
router.get("/gallery/folders", fetchGalleryFolders);
router.get("/gallery/folders/:folderId/media", fetchFolderMedia);
router.delete("/gallery/folders/:folderId", deleteGalleryFolder);
router.post("/gallery/move", moveGalleryMedia);
router.put("/gallery/folders/:folderId", renameGalleryFolder);
router.get("/gallery/all", fetchAllMedias);

//new menu
router.get("/new/menu", getAllMenus);
router.post("/new/menu", createMenu);
router.get("/new/menu/:id", getSingleMenu);
router.put("/new/menu/:id", updateMenu);
router.delete("/new/menu/:id", deleteMenu);

router.post("/author", upload.single("image"), authorController.createAuthor);
router.get("/author", authorController.getAllAuthors);
router.get("/author/:id", authorController.getAuthorById);
router.put(
  "/author/:id",
  upload.single("image"),
  authorController.updateAuthor
);
router.delete("/author/:id", authorController.deleteAuthor);

//settings
router.post("/new/setting", addOrUpdateSettings);

router.get("/new/setting", getSettingsNew);

router.patch("/new/setting/section", upload.single("file"), updateSection);

router.post("/new/setting/platform", createSocialMediaPlatform);
router.get("/get/setting/platforms", getSocialMediaPlatforms);

router.post("/add/setting/link", createSocialMediaLink);
router.get("/get/setting/link", getAllSocialMediaLinks);
router.put("/update/setting/link/:id", updateSocialMediaLink);
router.delete("/delete/setting/link/:id", deleteSocialMediaLink);

//event route
router.get("/get/event/all", getAllEvents);
router.post("/add/event/new", createEvent);
router.get("/get/event/:id", getSingleEvent);
router.put("/update/event/:id", updateEvent);
router.delete("/delete/event/:id", deleteEvent);

//testimonials route
router.post(
  "/testimonials",
  upload.fields([
    { name: "author_photo", maxCount: 1 }, // Allow 1 file for author_photo
    { name: "image_url", maxCount: 1 }, // Allow 1 file for image_url
    { name: "video_url", maxCount: 1 }, // Allow 1 file for video_url
  ]),
  createTestimonial
);

router.get("/testimonials", getAllTestimonials);

router.get("/testimonials/:id", getTestimonialById);

router.put(
  "/testimonials/:id",
  upload.fields([
    { name: "author_photo", maxCount: 1 }, // Allow 1 file for author_photo
    { name: "image_url", maxCount: 1 }, // Allow 1 file for image_url
    { name: "video_url", maxCount: 1 }, // Allow 1 file for video_url
  ]),
  updateTestimonial
);

router.delete("/testimonials/:id", deleteTestimonial);

// menu routes

const iconStorage = multer.diskStorage({
  destination: "./uploads/icons",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const iconUpload = multer({
  storage: iconStorage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, (error, isValid, jsonError) => {
      if (isValid) {
        cb(null, true);
      } else {
        cb(error);
      }
    });
  },
});

router.get("/menu", (req, res) => {
  res.render("menu/index", { title: "Menu" });
});
router.get("/menu/md", AllMainDesktop);
router.post("/menu/md", iconUpload.single("icon"), createMainDesktop);
router.get("/menu/md/:id", getMainDesktopChild);
router.put("/menu/md/:id", iconUpload.single("icon"), updateMainDesktop);
router.get("/menu/md/:id/delete", deleteMainDesktop);

router.get("/menu/fd", AllFooterDesktop);
router.post("/menu/fd", iconUpload.single("icon"), createFooterDesktop);
router.get("/menu/fd/:id", getFooterDesktopDetail);
router.put("/menu/fd/:id", iconUpload.single("icon"), updateFooterDesktop);
router.get("/menu/fd/:id/delete", deleteFooterDesktop);

router.get("/menu/mm", AllMainMobile);
router.post("/menu/mm", iconUpload.single("icon"), createMainMobile);
router.get("/menu/mm/:id", getMainMobileDetail);
router.put("/menu/mm/:id", iconUpload.single("icon"), updateMainMobile);
router.get("/menu/mm/:id/delete", deleteMainMobile);

router.get("/menu/fm", AllFooterMobile);
router.post("/menu/fm", iconUpload.single("icon"), createFooterMobile);
router.get("/menu/fm/:id", getFooterMobileDetail);
router.put("/menu/fm/:id", iconUpload.single("icon"), updateFooterMobile);
router.get("/menu/fm/:id/delete", deleteFooterMobile);

router.get("/import", getDetails);
router.post("/import/blogs", addNewBlogs);

const settingsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/assets");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const settingsUpload = multer({
  storage: settingsStorage,
  fileFilter: (req, file, cb) => {
    // Your custom file type validation logic
    checkFileType(file, (error, isValid) => {
      if (isValid) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"), false);
      }
    });
  },
});

router.get("/settings", getAllSettings);
router.get("/settings/create", (req, res) => {
  res.render("settings/create", { title: "Create Settings" });
});
router.get("/settings/:id", getSettings);
router.post(
  "/settings",
  settingsUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  createSettings
);
router.put("/settings/:id", updateSettings);
router.get("/settings/:id/delete");

//dynamic pages
router.get("/pages", getAllPages);
router.get("/pages/create", (req, res) => {
  res.render("page/create", { title: "Create Page" });
});
router.get("/pages/:id", getPageDetails);
router.post("/pages", createPage);
router.put("/pages/:id/update", updatePage);
router.patch("/pages/:id/publish", togglePagePublishStatus);
router.put("/pages/update/:id/meta", updateMetaData);
router.get("/pages/:id/delete", deletePage);

//static pages

router.get("/staticpages", getAllStaticPages);
router.get("/staticpages/create", (req, res) => {
  res.render("staticpages/create", { title: "Create Static Page" });
});
router.get("/staticpages/:id", getStaticPageDetails);
router.put("/staticpages/:id/update", updateStaticPage);
router.get("/staticpages/:id/delete", deleteStaticPage);

// notification

router.get("/notifications", getAllNotifications);
router.get("/notifications/create", (req, res) => {
  res.render("notifications/create");
});
router.post("/notifications", createNotification);
router.get("/notifications/:id", getNotification);
router.put("/notifications/:id", updateNotification);
router.get("/notifications/:id/delete", deleteNotification);

//robot.txt

router.get("/robot", getRobotTxt);
router.post("/robot", createRobotTxt);

//user specific details

router.get("/user/:id", getPersonalDetails);
router.get("/user/:id/blogs", getPersonBlogs);
router.get("/user/:id/forums", getPersonForums);

//301 redirects

router.get("/redirect", getAllRedirects);
router.post("/redirect", createRedirect);
router.get("/redirect/:id", getRedirect);
router.put("/redirect/:id", updateRedirect);
router.delete("/redirect/:id", deleteRedirect);

// static Page
router.get("/staticpage", staticPageController.getAllStaticPages);
router.post("/staticpage", staticPageController.createStaticPage);
router.get("/staticpage/:slug", staticPageController.getStaticPageDetails);
router.put("/staticpage/:slug", staticPageController.updateStaticPageContent);
router.put("/staticpage/:id", staticPageController.updateStaticPage);
router.put("/staticpage/:id/status",staticPageController.updateStaticPageStatus);
router.delete("/staticpage/:id", staticPageController.deleteStaticPage);

//brand page
router.get("/brand", getAllBrands);
router.get("/brand/:slug", getBrandBySlug);
router.post("/brand", createBrand);
router.put("/brand/:id", updateBrand);
router.delete("/brand/:id", deleteBrand);

// category page
router.get("/product-category", getAllCategories);
router.post("/product-category", createCategory);
router.put("/product-category/:id", updateCategory);
router.get("/product-category/:slug", getCategoryBySlug),
  router.delete("/product-category/:id", deleteCategory);
router.get("/product-category/items/:id", getAllOptions);
router.post("/product-category/items/:id", addNewOption);
router.put("/product-category/items/:id/:option_id", updateOption);
router.delete("/product-category/items/:id/:option_id", deleteOption);

// product variant section
router.get("/product/variant/:id", productController.getAllVariants);
router.get("/product/variant/:variant_id", productController.getVariant);
router.post("/product/variant", productController.createVariant);
router.put("/product/variant/:id", productController.updateVariant);
router.delete("/product/variant/:id", productController.deleteVariant);

//product page
router.post("/product", productController.createProduct);
router.get("/product", productController.getAllProducts);
router.get("/product/brand", productController.getAllBrand);
router.get("/product/category", productController.getAllCategory);
router.put("/product/:id", productController.updateProduct);
router.delete("/product/:id", productController.deleteProduct);
router.get("/product/:id", productController.getProduct);

// stock history page
router.get("/out-of-stock", getOutOfStockVariants);
router.get("/stock-history", getAllStockHistory);
router.get("/stock-history/product/:product_id", getStockHistoryByProductId);
router.get("/stock-history/:id", getStockHistoryById);
router.get("/orders", productController.orderList);

router.post("/list-items", createListItem);
router.put("/list-items/:id", updateListItem);
router.delete("/list-items/:id", deleteListItem);
router.get("/list-items", getAllListItems);
router.get("/list-items/:id", getListItemById);

// For admin list items
router.post("/list-items/:listId/entries", createItem);
router.get("/list-items/:listId/entries", getAllItems);
router.get("/list-items/:listId/entries/:id", getItemById);
router.put("/list-items/:listId/entries/:id", updateItem);
router.delete("/list-items/:listId/entries/:id", deleteItem);

//service details routes

router.get("/service-details", serviceDetailsController.getAllServiceDetails);

router.post("/service-details", serviceDetailsController.createServiceDetails);

router.get(
  "/service-details/:slug",
  serviceDetailsController.getServiceDetailsBySlug
);

router.put(
  "/service-details/:slug",
  serviceDetailsController.updateServiceDetails
);

router.put(
  "/service-details/:slug/status",
  serviceDetailsController.updateServiceDetailsStatus
);

router.delete(
  "/service-details/:slug",
  serviceDetailsController.deleteServiceDetails
);

// In your backend routes
router.get("/media/images", serviceDetailsController.getMediaForSelection);

router.get("/media/videos", (req, res) => {
  req.query.type = "video";
  return serviceDetailsController.getMediaForSelection(req, res);
});

// Add this route to your backend
router.get("/media/all", serviceDetailsController.getMediaForSelection);
router.post(
  "/media/upload",
  uploader.single("file"),
  mediaController.uploadMedia
);

module.exports = router;
