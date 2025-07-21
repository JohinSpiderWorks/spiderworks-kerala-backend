require("dotenv").config();

const sequelize = require("../config/sequelize.config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var emailValidator = require("email-validator");
var { passwordStrength } = require("check-password-strength");
const userModel = require("../models/user.model");
const blogModel = require("../models/blog.model");
const bannerImageModel = require("../models/bannerImage.model");
const { Op, where } = require("sequelize");
const fs = require("fs");
const blogSectionModel = require("../models/blogSection.model");
const blogCommentModel = require("../models/blogComment.model");
const blogLikeModel = require("../models/blogLike.model");
const blogReplyModel = require("../models/blogReply.model");
const blogSaveModel = require("../models/blogSave.model");
const blogCategoryModel = require("../models/blogCategory.model");
const sendOtpEmail = require("../utils/email"); // Adjust path based on your structure
const loginHistoryModel = require("../models/loginHistory.model");
const { logError, errorTypes } = require("../utils/logger");
const authorModel = require("../models/author.model");
const { log } = require("console");
const blogCategoryMapModel = require("../models/blogCategoryMap.model");

//Create a new User
const createAdmin = async (req, res) => {
  const { email, name, password } = req.body;

  try {
    const findAdmin = await userModel.findOne({
      where: {
        role: "admin",
      },
    });

    // if (findAdmin) {
    //   return res.status(401).json({ err: "Admin Already Exists" });
    // }

    const findEmail = await userModel.findOne({
      where: {
        email: email,
      },
    });
    if (findEmail) {
      return res.status(401).json({ err: "Email Already Exists" });
    }

    if (!emailValidator.validate(email) || email.length > 50) {
      return res
        .status(400)
        .json({ type: "email", err: "Please Enter Valid Email" });
    }
    if (email.length < 10) {
      return res
        .status(400)
        .json({ type: "email", err: "Email must contain 12 characters" });
    }

    if (passwordStrength(password).id < 2) {
      return res
        .status(400)
        .json({ type: "password", err: "Please Enter Strong Password" });
    } else if (password.length > 20 || password.length < 6) {
      return res
        .status(400)
        .json({ type: "password", err: "Please Enter Valid Password" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const createUser = await userModel.create({
      name: name,
      email: email,
      password: hashPassword,
      role: "admin",
    });

    const token = jwt.sign(
      createUser.dataValues.id,
      process.env.JWT_SECRET_TOKEN
    );

    res.cookie("admin", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
    return res.status(201).json({
      user: {
        id: createUser.dataValues.id,
        email: createUser.dataValues.email,
        name: createUser.dataValues.name,
        token: token,
        redirect: "/admin/dashboard",
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ err: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];
  const transaction = await sequelize.transaction();

  try {
    const findAdmin = await userModel.findOne({
      where: { email, role: "admin" },
      transaction,
    });

    if (!findAdmin) {
      await loginHistoryModel.create(
        {
          user_id: "unknown",
          status: "failed",
          reason: "Invalid email",
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        { transaction }
      );

      await transaction.commit();

      // Log the failed attempt
      logError(new Error("Invalid email attempt"), errorTypes.AUTH, {
        email,
        ipAddress,
        userAgent,
        reason: "Invalid email",
      });

      return res.status(404).json({ type: "email", err: "Invalid Email" });
    }

    // Check account lock status
    if (
      findAdmin.dataValues.account_locked_until &&
      new Date() < new Date(findAdmin.dataValues.account_locked_until)
    ) {
      await loginHistoryModel.create(
        {
          user_id: findAdmin.dataValues.id,
          status: "failed",
          reason: "Account locked",
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        { transaction }
      );

      await transaction.commit();

      // Log the locked account attempt
      logError(new Error("Account locked attempt"), errorTypes.AUTH, {
        userId: findAdmin.dataValues.id,
        email,
        ipAddress,
        userAgent,
        unlockTime: findAdmin.dataValues.account_locked_until,
      });

      return res.status(403).json({
        type: "account",
        err: "Account locked. Please try again later.",
        unlockTime: findAdmin.dataValues.account_locked_until.toISOString(),
      });
    }

    const checkPassword = await bcrypt.compare(
      password,
      findAdmin.dataValues.password
    );

    if (!checkPassword) {
      const currentAttempts =
        Number(findAdmin.dataValues.failed_login_attempts) || 0;
      const newFailedAttempts = currentAttempts + 1;

      const updateData = {
        failed_login_attempts: newFailedAttempts,
      };

      if (newFailedAttempts >= 3) {
        const lockDuration = 60 * 60 * 1000; // 1 hour
        updateData.account_locked_until = new Date(Date.now() + lockDuration);
      }

      await userModel.update(updateData, {
        where: { id: findAdmin.dataValues.id },
        transaction,
      });

      await loginHistoryModel.create(
        {
          user_id: findAdmin.dataValues.id,
          status: "failed",
          reason: "Wrong password",
          ip_address: ipAddress,
          user_agent: userAgent,
        },
        { transaction }
      );

      await transaction.commit();

      // Log the wrong password attempt
      logError(new Error("Wrong password attempt"), errorTypes.AUTH, {
        userId: findAdmin.dataValues.id,
        email,
        ipAddress,
        userAgent,
        attempts: newFailedAttempts,
      });

      return res.status(401).json({
        type: "password",
        err: "Wrong Password",
        attemptsLeft: Math.max(0, 3 - newFailedAttempts),
      });
    }

    // Successful password check - reset counters
    await userModel.update(
      {
        failed_login_attempts: 0,
        account_locked_until: null,
      },
      {
        where: { id: findAdmin.dataValues.id },
        transaction,
      }
    );

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await userModel.update(
      { otp, otp_expires: new Date(otpExpiry) },
      {
        where: { id: findAdmin.dataValues.id },
        transaction,
      }
    );

    sendOtpEmail(findAdmin.dataValues.email, otp);

    await loginHistoryModel.create(
      {
        user_id: findAdmin.dataValues.id,
        status: "pending",
        reason: "OTP generated",
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    await transaction.rollback();

    // Log the unexpected error
    logError(error, errorTypes.SERVER, {
      email,
      ipAddress,
      userAgent,
      route: "/login",
      method: "POST",
    });

    console.error("Login error:", error);
    res.status(500).json({ err: error.message });
  }
};

const verifyOtp = async (req, res) => {
  
  const { email, otp } = req.body;
  const ipAddress =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    const findAdmin = await userModel.findOne({
      where: { email, role: "admin" },
    });

    if (!findAdmin) {
      await loginHistoryModel.create({
        user_id: "unknown",
        status: "failed",
        reason: "Invalid email during OTP verification",
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      return res.status(404).json({ type: "email", err: "Invalid Email" });
    }

    if (
      findAdmin.dataValues.account_locked_until &&
      findAdmin.dataValues.account_locked_until > new Date()
    ) {
      await loginHistoryModel.create({
        user_id: findAdmin.dataValues.id,
        status: "failed",
        reason: "Account locked during OTP verification",
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      return res.status(403).json({
        type: "account",
        err: "Account locked. Please try again later.",
        unlockTime: findAdmin.dataValues.account_locked_until.toISOString(),
      });
    }

    if (
      findAdmin.dataValues.otp !== otp ||
      findAdmin.dataValues.otp_expires < new Date()
    ) {
      await loginHistoryModel.create({
        user_id: findAdmin.dataValues.id,
        status: "failed",
        reason: "Invalid or expired OTP",
        ip_address: ipAddress,
        user_agent: userAgent,
      });
      return res
        .status(401)
        .json({ type: "otp", err: "Invalid or Expired OTP" });
    }

    await userModel.update(
      { otp: null, otp_expires: null },
      { where: { id: findAdmin.dataValues.id } }
    );

    // OLD TOKEN GENERATION STYLE
    const token = jwt.sign(
      findAdmin.dataValues.id.toString(), // Ensure it's a string if your old system expected that
      process.env.JWT_SECRET_TOKEN
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.setHeader(
      "Set-Cookie",
      `admin=${token}; HttpOnly; Path=/; ${
        isProduction ? "Secure; SameSite=Strict" : "SameSite=Lax"
      }; Max-Age=3600`
    );

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

    await loginHistoryModel.create({
      user_id: findAdmin.dataValues.id,
      status: "success",
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return res.status(200).json({
      token,
      user: {
        id: findAdmin.dataValues.id,
        name: findAdmin.dataValues.name,
        email: findAdmin.dataValues.email,
        redirect: "/admin/dashboard",
      },
    });
  } catch (error) { 
    console.log("error",error);
    
    res.status(500).json({ err: error.message });
  }
};

const logout = async (req, res) => {
  const ipAddress =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"];

  try {
    // Log logout action if user is authenticated
    if (req.user && req.user.id) {
      await loginHistoryModel.create({
        user_id: req.user.id,
        status: "logout",
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    }

    res.clearCookie("admin", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};


const getAllBlogs = async (req, res) => {
  //console.log("start");

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { publish, premium, query } = req.query;

    let whereClause = {};

    if (publish === "true" || publish === "false") {
      whereClause.is_published = publish === "true";
    }
    if (premium === "true" || premium === "false") {
      whereClause.premium = premium === "true";
    }
    if (query) {
      whereClause.title = {
        [Op.iLike]: `%${query}%`,
      };
    }

    const blogs = await blogModel.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: userModel,
          as: "creator",
          attributes: { exclude: ["password"] },
        },
        {
          model: authorModel,
          as: "blogAuthor",
          required: false,
        },
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
      ],
      limit,
      offset,
      logging: console.log, // Add logging to inspect the SQL query
    });

    //console.log("Blogs result:", blogs); // Log the result to check for undefined

    const categories = await blogCategoryModel.findAll({});

    const totalPages = Math.ceil(blogs.count / limit);
    res.status(200).json({
      data: blogs.rows,
      categories,
      title: "Blogs List",
      query: { page, limit, totalPages },
    });
  } catch (error) {
    console.error("getAllBlogs error:", error.message);
    res.status(500).json({ err: error.message });
  }
};



const getBlogDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }
    return res.status(200).json(findBlog.dataValues); // Return JSON instead of rendering
  } catch (err) {
    console.error("Error in getBlogDetail:", err); // Log error for debugging
    return res.status(500).json({ err: "Internal server error" });
  }
};

// const getBlogDetail = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const findBlog = await blogModel.findByPk(id);

//     if (!findBlog) {
//       return res.status(404).json({ err: "Blog not-found" });
//     }
//     res.render("blogdetail", {
//       blog: findBlog.dataValues,
//       title: findBlog.dataValues.title,
//     });
//   } catch (err) {
//     res.json({ err: err.message });
//   }
// };

const createBlog = async (req, res) => {
  let transaction;
  
  try {
    // Required field validation
    if (!req.body.title) {
      return res.status(400).json({
        type: "title",
        err: "Title is required",
      });
    }

    // Start transaction
    transaction = await sequelize.transaction();

    // Parse and validate input data
    const {
      title,
      short_description = "",
      top_description = "",
      bottom_description = "",
      is_published = "false",
      premium = "false",
      sections = "[]",
      publish_date,
      author_id,
      type = "none",
      categories = "[]",
    } = req.body;

    // Validate blog type
    const validTypes = ["banner", "featured", "standard", "none"];
    if (!validTypes.includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        type: "type",
        err: "Invalid blog type",
      });
    }

    // Parse sections
    let parsedSections = [];
    try {
      parsedSections = JSON.parse(sections);
      if (!Array.isArray(parsedSections)) {
        throw new Error("Invalid sections format");
      }
    } catch (error) {
      console.error("Error parsing sections:", error);
      parsedSections = [];
    }

    // Handle banner image
    let bannerImage = null;
    if (req.file) {
      try {
        bannerImage = await bannerImageModel.create({
          path: `/uploads/${req.file.filename}`,
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          destination: req.file.destination,
          filename: req.file.filename,
          size: req.file.size,
        });
      } catch (error) {
        console.error("Error saving banner image:", error);
        // Continue without banner image if there's an error
      }
    }

    // Create blog
    const newBlog = await blogModel.create({
      title,
      short_description,
      top_description,
      bottom_description,
      is_published: is_published === "true",
      premium: premium === "true",
      type,
      created_by: req.user.id,
      author_id: author_id || null,
      banner_id: bannerImage?.id || null,
      contentSections: parsedSections,
      publish_date: publish_date ? new Date(publish_date) : new Date(),
    }, { transaction });

    // Handle categories
    let parsedCategories = [];
    try {
      parsedCategories = JSON.parse(categories);
      if (!Array.isArray(parsedCategories)) {
        throw new Error("Invalid categories format");
      }
    } catch (error) {
      console.error("Error parsing categories:", error);
      parsedCategories = [];
    }

    // Create category associations
    if (parsedCategories.length > 0) {
      try {
        await blogCategoryMapModel.bulkCreate(
          parsedCategories.map(categoryId => ({
            blog_id: newBlog.id,
            category_id: categoryId
          })),
          { transaction }
        );
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          err: "Invalid category IDs provided",
        });
      }
    }

    // Create sections if using separate model
    if (blogSectionModel && parsedSections.length > 0) {
      try {
        await blogSectionModel.bulkCreate(
          parsedSections.map((section, index) => ({
            blog_id: newBlog.id,
            heading: section.title || "",
            content: section.content || "",
            order: index,
          })),
          { transaction }
        );
      } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
          err: "Failed to create sections",
        });
      }
    }

    // Commit transaction
    await transaction.commit();

    // Fetch complete blog with associations
    const completeBlog = await blogModel.findByPk(newBlog.id, {
      include: [
        // ... your association includes
      ],
    });

    return res.status(201).json({
      success: true,
      data: completeBlog,
    });

  } catch (error) {
    // Only rollback if transaction exists and hasn't been committed
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error creating blog:", error);
    return res.status(500).json({
      success: false,
      err: "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        details: error.message,
      }),
    });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params; // Changed from blogId to id to match common conventions

  try {
    // Find the blog with all associated data
    const blog = await blogModel.findOne({
      where: { id },
      include: [
        { model: bannerImageModel, as: "bannerImage" },
        { model: bannerImageModel, as: "featuredImage" },
        { model: bannerImageModel, as: "ogImage" },
      ],
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if this is the only blog using these images
    const [bannerUsers, featuredUsers, ogUsers] = await Promise.all([
      blogModel.count({ where: { banner_id: blog.banner_id } }),
      blogModel.count({ where: { featured_id: blog.featured_id } }),
      blogModel.count({ where: { og_id: blog.og_id } }),
    ]);

    // Delete associated files and records
    await Promise.all([
      // Delete banner image if no other blogs use it
      bannerUsers <= 1 && blog.bannerImage && deleteImage(blog.bannerImage),
      // Delete featured image if no other blogs use it
      featuredUsers <= 1 &&
        blog.featuredImage &&
        deleteImage(blog.featuredImage),
      // Delete OG image if no other blogs use it
      ogUsers <= 1 && blog.ogImage && deleteImage(blog.ogImage),
      // Delete all sections
      blogSectionModel.destroy({ where: { blog_id: id } }),
      // Delete all saves
      blogSaveModel.destroy({ where: { blog_id: id } }),
      // Delete all comments
      blogCommentModel.destroy({ where: { blog_id: id } }),
    ]);

    // Finally delete the blog
    await blog.destroy();

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to delete image file and record
async function deleteImage(imageRecord) {
  try {
    if (imageRecord.path) {
      const filename = imageRecord.path.split("/").pop();
      const filePath = path.join("uploads", filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await imageRecord.destroy();
  } catch (err) {
    console.error("Error deleting image:", err);
  }
}

// const deleteBlog = async (req, res) => {
//   const { blogId } = req.params; // Use blogId to match frontend URL

//   try {
//     const findBlog = await blogModel.findOne({
//       where: { id: blogId },
//       include: [
//         { model: bannerImageModel, foreignKey: "banner_id", as: "banner" },
//         { model: bannerImageModel, foreignKey: "featured_id", as: "featured" },
//         { model: bannerImageModel, foreignKey: "og_id", as: "og" },
//         { model: blogSaveModel, foreignKey: "blog_id", as: "saved" },
//       ],
//     });

//     if (!findBlog) {
//       return res.status(404).json({ err: "Blog not found" });
//     }

//     const findBlogs = await blogModel.findAll({
//       where: { banner_id: findBlog.dataValues.banner_id },
//     });

//     if (findBlogs.length === 1) {
//       const bannerPath = findBlog?.dataValues?.banner?.path?.split("/")?.pop();
//       if (bannerPath && fs.existsSync(`uploads/${bannerPath}`)) {
//         await fs.unlink(`uploads/${bannerPath}`);
//         console.log("Banner image deleted successfully");
//       }

//       if (!findBlog.dataValues?.title?.startsWith("Draft")) {
//         const [banner, featured, og] = await Promise.all([
//           bannerImageModel.findByPk(findBlog.dataValues.banner_id),
//           bannerImageModel.findByPk(findBlog.dataValues.featured_id),
//           bannerImageModel.findByPk(findBlog.dataValues.og_id),
//         ]);

//         await Promise.all([
//           findBlog.destroy(),
//           banner?.destroy(),
//           featured?.destroy(),
//           og?.destroy(),
//           blogSaveModel.destroy({ where: { blog_id: blogId } }),
//           blogSectionModel.destroy({
//             where: { blog_id: findBlog.dataValues.id },
//           }),
//           blogCommentModel.destroy({
//             where: { blog_id: findBlog.dataValues.id },
//           }),
//         ]);

//         return res.status(200).json({ message: "Blog deleted successfully" });
//       } else {
//         await findBlog.destroy();
//         return res
//           .status(200)
//           .json({ message: "Draft blog deleted successfully" });
//       }
//     } else {
//       await findBlog.destroy();
//       return res.status(200).json({ message: "Blog deleted successfully" });
//     }
//   } catch (error) {
//     console.error("Delete Blog Error:", error);
//     return res.status(500).json({ err: error.message });
//   }
// };

const searchBlogs = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ err: "Search query is required" });
    }

    const blogs = await blogModel.findAll({
      where: {
        title: {
          [Op.iLike]: `%${query}%`, // Case-insensitive search
        },
      },
      include: [
        {
          model: bannerImageModel,
          as: "banner",
        },
        {
          model: blogSectionModel,
          as: "sections",
        },
      ],
    });

    res.status(200).json({ data: blogs });
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ err: "Error searching blogs" });
  }
};

//update for fetch the category 15/jul/25
// const getUpdateBlog = async (req, res) => {
//   const { id } = req.params;
//   console.log("Fetching blog with ID:", id);

//   try {
//     // Handle type updates
//     if (req?.query?.type) {
//       await blogModel.update({ type: req?.query?.type }, { where: { id } });
//       return res.json({ success: true, message: "Blog type updated" });
//     }

//     // Handle publish status updates
//     if (req?.query?.publish) {
//       const newPublishState = req?.query?.publish === "true" ? false : true;
//       await blogModel.update(
//         { is_published: newPublishState },
//         { where: { id } }
//       );
//       return res.json({ success: true, message: "Publish status updated" });
//     }

//     // Handle premium status updates
//     if (req?.query?.premium) {
//       const newPremiumState = req?.query?.premium === "true" ? false : true;
//       await blogModel.update({ premium: newPremiumState }, { where: { id } });
//       return res.json({ success: true, message: "Premium status updated" });
//     }

//     // Fetch the blog with related models
//     const blog = await blogModel.findByPk(id, {
//       include: [
//         {
//           model: userModel,
//           as: "creator",
//           attributes: ["id", "name", "email", "bio"],
//         },
//         { model: bannerImageModel, as: "bannerImage" }, // ✅ Matches association
//         { model: bannerImageModel, as: "featuredImage" }, // ✅ Matches association
//         { model: bannerImageModel, as: "ogImage" }, // ✅ Matches association
//         { model: blogSectionModel, as: "sections" },
//         { model: blogCommentModel, as: "comments" },
//       ],
//     });

//     if (!blog) {
//       return res.status(404).json({ error: "Blog not found" });
//     }

//     // Return JSON
//     console.log(blog, "...this is blog...");

//     return res.json(blog);
//   } catch (error) {
//     console.error("Error fetching blog:", error);
//     return res.status(500).json({ error: error.message });
//   }
// };

const getUpdateBlog = async (req, res) => {
  const { id } = req.params;

  try {
    // Handle query parameter updates first
    if (req?.query?.type) {
      await blogModel.update({ type: req.query.type }, { where: { id } });
      return res.json({ success: true, message: "Blog type updated" });
    }

    if (req?.query?.publish) {
      const newPublishState = req.query.publish !== "true"; // Toggle
      await blogModel.update({ is_published: newPublishState }, { where: { id } });
      return res.json({ success: true, message: "Publish status updated" });
    }

    if (req?.query?.premium) {
      const newPremiumState = req.query.premium !== "true"; // Toggle
      await blogModel.update({ premium: newPremiumState }, { where: { id } });
      return res.json({ success: true, message: "Premium status updated" });
    }

    // Fetch the blog with all relationships
    const blog = await blogModel.findByPk(id, {
      include: [
        {
          model: userModel,
          as: "creator",
          attributes: ["id", "name", "email", "bio"]
        },
        { model: bannerImageModel, as: "bannerImage" },
        { model: bannerImageModel, as: "featuredImage" },
        { model: bannerImageModel, as: "ogImage" },
        { model: blogSectionModel, as: "sections" },
        { model: blogCommentModel, as: "comments" },
        {
          model: blogCategoryModel,
          as: "blog_categories", // Must match your association alias exactly
          through: { 
            attributes: ["type"] // Include junction table fields if needed
          },
          attributes: ["id", "name", "slug"] // Specify which category fields to include
        }
      ]
    });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    return res.json(blog);
  } catch (error) {
    console.error("Error in getUpdateBlog:", error);
    return res.status(500).json({ error: error.message });
  }
};

const updateBlog = async (req, res) => {
  console.log(req);
  const { id } = req.params;
  const {
    title,
    short_description,
    top_description, // This is actually `description` in frontend
    bottom_description,
    is_published,
    premium,
    sections,
  } = req.body;

  const parseSection = JSON.parse(sections);

  try {
    // Validate title length
    if (title?.length > 200 || title?.length < 2) {
      return res.status(400).json({
        type: "title",
        err: "Title must be between 2 and 200 characters",
      });
    }

    // Find the blog to update
    const findBlog = await blogModel.findByPk(id, {
      include: [{ model: blogSectionModel, as: "sections" }],
    });

    if (!findBlog) {
      return res.status(404).json({ err: "Blog not found" });
    }

    // Update blog details
    await findBlog.update({
      title,
      description: short_description,
      top_description, // Using top_description as description
      short_description,
      bottom_description,
      is_published: is_published === "true" || is_published === true, // Ensure boolean
      premium: premium === "true" || premium === true, // Ensure boolean
      author: req.user.id,
      role: "admin",
      type: req.body.type,
    });

    // Update sections
    const existingSectionIds = findBlog.sections.map((section) => section.id);

    for (const section of parseSection) {
      if (section.id) {
        // Update existing section
        if (existingSectionIds.includes(section.id)) {
          await blogSectionModel.update(
            {
              heading: section.heading,
              content: section.content,
              section_name: section.heading,
            },
            { where: { id: section.id, blog_id: id } }
          );
        }
      } else {
        // Create new section
        await blogSectionModel.create({
          blog_id: id,
          heading: section.heading,
          content: section.content,
          section_name: section.heading,
        });
      }
    }

    // Delete sections that were removed
    const newSectionIds = parseSection
      .filter((section) => section.id)
      .map((section) => section.id);
    const sectionsToDelete = existingSectionIds.filter(
      (sectionId) => !newSectionIds.includes(sectionId)
    );

    if (sectionsToDelete.length > 0) {
      await blogSectionModel.destroy({
        where: {
          id: sectionsToDelete,
          blog_id: id,
        },
      });
    }

    // Handle file upload if a new image is provided
    if (req.file) {
      const bannerImage = await bannerImageModel.create({
        path: `/uploads/${req.file.filename}`,
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        destination: req.file.destination,
        filename: req.file.filename,
        size: req.file.size,
      });

      // Delete old banner image if it exists
      if (findBlog.banner_id) {
        const findBlogs = await blogModel.findAll({
          where: { banner_id: findBlog.banner_id },
        });

        if (findBlogs.length === 1) {
          const oldBannerPath = `uploads/${findBlog.banner?.path
            ?.split("/")
            ?.pop()}`;
          if (fs.existsSync(oldBannerPath)) {
            try {
              await fs.promises.unlink(oldBannerPath);
              console.log("Old banner image deleted successfully");
            } catch (err) {
              return res.json({ err: err.message });
            }
          }
        }
      }

      // Update blog with new banner ID
      await findBlog.update({ banner_id: bannerImage.dataValues.id });
    }

    res.status(200).json({ msg: "Blog updated successfully" });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getUpdateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const findUser = await userModel.findByPk(id);
    if (!findUser) {
      return res.status(404).json({ err: "User not found" });
    }

    // Return JSON instead of rendering a view
    res.status(200).json(findUser);
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params; // Extract the ID from request parameters

  try {
    console.log(`Attempting to delete user with ID: ${id}`);

    const findUser = await userModel.findByPk(id);

    if (!findUser) {
      return res.status(404).json({ err: "User not found" });
    }

    await findUser.destroy();

    // Send JSON response instead of redirecting
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ err: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const phonePattern = /^[0-9]{10}$/;
  try {
    const findUser = await userModel.findByPk(id);
    if (!findUser) {
      return res.status(404).json({ err: "User not found" });
    }

    if (
      !emailValidator.validate(req?.body?.email) ||
      req?.body?.email.length > 20
    ) {
      return res
        .status(400)
        .json({ type: "email", err: "Please Enter Valid Email" });
    }
    if (req?.body?.email.length < 12) {
      return res
        .status(400)
        .json({ type: "email", err: "Email must contain 12 characters" });
    }

    if (req.body?.phone) {
      if (!phonePattern.test(req.body?.phone)) {
        return res
          .status(409)
          .json({ type: "phone", err: "Please Enter Valid Mobile Number" });
      }
    }

    if (req?.body?.bio?.length > 70) {
      return res
        .status(400)
        .json({ type: "bio", err: "Bio must be less than 50 characters" });
    }

    await findUser.update(req.body, {
      where: {
        id: id,
      },
    });
    console.log({ findUser: findUser });
    res.json({ data: findUser.dataValues, msg: "Update Successfully" });
    // res.redirect("/admin/dashboard");
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const searchUser = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const users = await userModel.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } }, // Case-insensitive search
          { email: { [Op.iLike]: `%${query}%` } },
        ],
      },
    });

    res.json({ data: users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const dashboard = async (req, res) => {
  const page = parseInt(req?.query?.page) || 1;
  const limit = parseInt(req?.query?.limit) || 10;
  const role = req?.query?.role || "all";
  const offset = (page - 1) * limit;

  try {
    let whereCondition = {};

    if (role !== "all") {
      whereCondition.role = role;
    } else {
      whereCondition.role = { [Op.ne]: "admin" };
    }

    const { count, rows } = await userModel.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      attributes: { exclude: ["password"] },
    });

    res.json({
      title: "Users List",
      role: role,
      data: rows,
      page,
      limit,
      lastPage: Math.ceil(count / limit), // Use Math.ceil to round up
    });
  } catch (error) {
    console.log({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

const duplicateBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const findBlog = await blogModel.findByPk(id, {
      include: [
        {
          model: blogSectionModel,
          foreignKey: "blog_id",
          as: "sections",
        },
      ],
    });

    if (findBlog) {
      // Create the duplicate blog
      const createDuplicateBlog = await blogModel.create({
        title: req?.query?.title,
        short_description: findBlog.dataValues.short_description,
        description: findBlog.dataValues.description,
        is_published: findBlog.dataValues.is_published,
        top_description: findBlog?.dataValues?.top_description,
        bottom_description: findBlog?.dataValues?.bottom_description,
        publish_date: findBlog.dataValues.publish_date,
        premium: findBlog.dataValues.premium,
        meta_title: findBlog.dataValues.meta_title,
        meta_description: findBlog.dataValues.meta_description,
        banner_id: findBlog.dataValues.banner_id,
        featured_id: findBlog.dataValues.featured_id,
        og_id: findBlog.dataValues.og_id,
        author: findBlog.dataValues.author,
        role: findBlog.dataValues.role,
      });

      // Duplicate sections
      if (findBlog.sections && findBlog.sections.length > 0) {
        const sectionPromises = findBlog.sections.map((section) =>
          blogSectionModel.create({
            blog_id: createDuplicateBlog.id,
            heading: section.heading,
            content: section.content,
            section_name: section.heading,
          })
        );
        await Promise.all(sectionPromises);
      }

      res.redirect("/admin/dashboard/blogs");
    } else {
      res.status(404).json({ err: "Blog not found" });
    }
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getAllComments = async (req, res) => {
  try {
    const allComments = await blogCommentModel.findAll({
      include: [
        {
          model: userModel,
          foreignKey: "user_id",
          as: "commented_by",
        },
        {
          model: blogModel,
          foreignKey: "blog_id",
          as: "blog",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!allComments || allComments.length === 0) {
      return res.status(404).json({ message: "No comments found", data: [] });
    }

    res.status(200).json({
      message: "All blog comments retrieved successfully",
      data: allComments,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getComments = async (req, res) => {
  const { id } = req.params;

  try {
    const findComments = await blogCommentModel.findAll({
      where: { blog_id: id },
      include: [
        {
          model: userModel,
          foreignKey: "user_id",
          as: "commented_by",
        },
      ],
    });

    if (!findComments || findComments.length === 0) {
      return res.status(404).json({ message: "No comments found", data: [] });
    }

    res
      .status(200)
      .json({ message: "Comments retrieved successfully", data: findComments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const postComment = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    if (comment?.length < 5) {
      return res
        .status(409)
        .json({ err: "Comment must be at least 5 characters long." });
    }

    const findBlog = await blogModel.findByPk(id);
    if (!findBlog) {
      return res.status(404).json({ err: "Blog notfound" });
    }

    const newComment = await blogCommentModel.create({
      comment,
      user_id: req.user?.id,
      blog_id: id,
    });

    // Fetch with user included
    const fullComment = await blogCommentModel.findByPk(newComment.id, {
      include: [
        {
          model: userModel,
          foreignKey: "user_id",
          as: "commented_by",
        },
      ],
    });

    res.status(200).json({
      message: "Comment Created Successfully",
      data: fullComment,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const updateComment = async (req, res) => {
  const { id, comment_id } = req.params;
  const { comment } = req.body;

  try {
    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({
        message: "Comment must be at least 5 characters long",
      });
    }

    const findComment = await blogCommentModel.findByPk(comment_id);
    if (!findComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    findComment.comment = comment;
    await findComment.save();

    // Optional: include user data in response
    const updatedComment = await blogCommentModel.findByPk(comment_id, {
      include: [
        {
          model: userModel,
          as: "commented_by",
          foreignKey: "user_id",
        },
      ],
    });

    return res
      .status(200)
      .json({ message: "Comment updated successfully", data: updatedComment });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update comment", error: error.message });
  }
};

const getCommentById = async (req, res) => {
  const { comment_id } = req.params;

  try {
    const comment = await blogCommentModel.findByPk(comment_id, {
      include: [
        {
          model: userModel,
          as: "commented_by", // Must match alias in association
          attributes: ["id", "name", "email"], // Add 'profile_image' if needed
        },
        {
          model: blogModel,
          as: "blog", // if you have a blog association with alias 'blog'
          attributes: ["id", "title", "slug"],
        },
      ],
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found", data: null });
    }

    res.status(200).json({
      message: "Comment retrieved successfully",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// deleting the comment without checking user
// const deleteComment = async (req, res) => {
//   const { id, comment_id } = req.params;

//   const findComment = await blogCommentModel.findByPk(comment_id);
//   if (!findComment) {
//     return res.status(404).json({ err: "Comment not-found" });
//   }

//   await findComment.destroy();
//   res.redirect(`/admin/dashboard/blog/${id}/comments`);
// };

const deleteComment = async (req, res) => {
  const { id, comment_id } = req.params;

  try {
    const findComment = await blogCommentModel.findByPk(comment_id);
    if (!findComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await findComment.destroy();

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete comment", error });
  }
};

const updateBlogAttributes = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { type, premium, is_published } = req.body;

    const blog = await blogModel.findByPk(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (type) blog.type = type;
    if (premium !== undefined) blog.premium = premium;
    if (is_published !== undefined) blog.is_published = is_published;

    await blog.save();
    return res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const updateBlogMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { metaTitle, metaDescription, metaKeywords } = req.body;

    const blog = await blogModel.findByPk(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.meta_title = metaTitle || blog.meta_title;
    blog.meta_description = metaDescription || blog.meta_description;
    blog.meta_keywords = metaKeywords || blog.meta_keywords;

    await blog.save();

    return res.json({ message: "Blog metadata updated successfully", blog });
  } catch (error) {
    console.error("Error updating blog metadata:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateReply = async (req, res) => {
  const { reply_id } = req.params;

  try {
    const findReply = await blogReplyModel.findByPk(reply_id);
    if (!findReply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    await blogReplyModel.update(req.body, {
      where: { id: reply_id },
    });

    // Optional: return updated reply
    const updatedReply = await blogReplyModel.findByPk(reply_id);

    res.status(200).json({
      message: "Reply updated successfully",
      data: updatedReply,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update reply", error: error.message });
  }
};

const deleteReply = async (req, res) => {
  const { reply_id } = req.params;

  try {
    const findReply = await blogReplyModel.findByPk(reply_id);
    if (!findReply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    await findReply.destroy();

    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete reply", error: error.message });
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

module.exports = {
  createAdmin,
  login,
  getAllBlogs,
  duplicateBlog,
  deleteBlog,
  deleteUser,
  dashboard,
  createBlog,
  getUpdateBlog,
  updateBlog,
  getUpdateUser,
  getBlogDetail,
  updateUser,
  getAllComments,
  getComments,
  deleteComment,
  postComment,
  updateComment,
  getCommentById,
  updateBlogAttributes,
  updateBlogMetadata,
  verifyOtp,
  logout,
  searchUser,
  searchBlogs,
  deleteReply,
  updateReply,
  createReply,
};
