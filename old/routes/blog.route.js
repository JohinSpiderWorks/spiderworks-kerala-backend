const {
  getBlogDetail,
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  createComment,
  deleteComment,
  updateComment,
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
  getBlogBySlug,deleteBookmark,createBookmark,getCommentById,getFeaturedBlogs,createUser,getUser,updateUser,getPageDetails

} = require("../controller/blog.controller");
const { userAuth } = require("../middleware/auth.middleware");
const express = require("express");
const path = require("path");
const router = express.Router();
const multer = require("multer");
const checkFileType = require("../utils/checkFileType");
const { getAllMenus } = require("../controller/MenuController");
const { getAllStaticPages } = require("../controller/staticpage.controller");
const { staticPageController } = require("../controller/static-page.controller");
const { staticPageBlogController } = require("../controller/staticPageBlog.controller");
const storage = multer.diskStorage({
  destination: "./uploads/", // Folder to store uploaded images
  filename: (req, file, cb) => {
    cb(
      null,
      file.originalname + "-" + Date.now() + path.extname(file.originalname)
    );
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

router.get("/", getAllBlogs);
router.get("/new/menu", getAllMenus);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id/comment/:comment_id/reply", getReplies);
router.get("/staticpage", staticPageBlogController.getAllStaticPages);
router.get("/staticpage/:slug", staticPageBlogController.getStaticPageDetails);
router.get("/featured", getFeaturedBlogs);
router.post("/register", createUser);
router.get("/pages/:slug", getPageDetails);



//authentication middleware
router.use(userAuth);
//routes

//user
router.get("/user/profile", getUser);
router.put("/user/update", updateUser);

//saved
router.get('/saved',getAllSavedBlogs);
router.post('/saved/:blog_id',createSaveBlog);
router.delete('/saved/:id', deleteSavedBlog);
router.post("/blogs/:id/bookmark", createBookmark);
router.delete("/blogs/:id/bookmark/:save_id", deleteBookmark);


//blogs

router.post("/", upload.array("image", 3), createBlog);
router.get("/:id", getBlogDetail);
router.put("/:id", upload.array("image", 3), updateBlog);
router.delete("/:id", deleteBlog);


//like blog
router.post('/:id/favourite',createFavourite);
router.delete('/:id/favourite/:favourite_id',deleteFavourite)

//comment
router.post("/:id/comment", createComment);
router.put("/:id/comment/:comment_id", updateComment);
router.delete("/:id/comment/:comment_id", deleteComment);
router.get("/comment/:comment_id", getCommentById);

//likes
router.post("/:id/comment/:comment_id/like", createLike);
router.delete("/:id/comment/:comment_id/like/:like_id", deleteLike);

//reply

router.post("/:id/comment/:comment_id/reply", createReply);
router.put("/:id/comment/:comment_id/reply/:reply_id", updateReply);
router.delete("/:id/comment/:comment_id/reply/:reply_id", deleteReply);

module.exports = router;
