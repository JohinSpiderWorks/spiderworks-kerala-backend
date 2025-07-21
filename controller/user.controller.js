require("dotenv").config();
const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken");
var emailValidator = require("email-validator");
var { passwordStrength } = require("check-password-strength");
const blogModel = require("../models/blog.model");
const forumModel = require("../models/forum/forum.model");
const blogCommentModel = require("../models/blogComment.model.js");

//Create a new User
// const createUser = async (req, res) => {
//   const { email, name, password, bio, role, phone } = req.body;
//   const phonePattern = /^[0-9]{10}$/;
//   try {
//     if (!emailValidator.validate(email) || email.length > 20) {
//       return res
//         .status(400)
//         .json({ type: "email", err: "Please Enter Valid Email" });
//     }
//     if (email.length < 12) {
//       return res
//         .status(400)
//         .json({ type: "email", err: "Email must contain 12 characters" });
//     }
//     const findUser = await userModel.findOne({
//       where: {
//         email: email,
//       },
//     });

//     if (findUser) {
//       return res
//         .status(409)
//         .json({ type: "email", err: "Email Already Exist" });
//     }

//     if (req.body?.phone) {
//       if (!phonePattern.test(phone)) {
//         return res
//           .status(409)
//           .json({ type: "phone", err: "Please Enter Valid Mobile Number" });
//       }
//     }

//     if (passwordStrength(password).id < 2) {
//       return res
//         .status(400)
//         .json({ type: "password", err: "Please Enter Strong Password" });
//     } else if (password.length > 20 || password.length < 6) {
//       return res
//         .status(400)
//         .json({ type: "password", err: "Please Enter Valid Password" });
//     }

//     if (bio?.length > 70) {
//       return res
//         .status(400)
//         .json({ type: "bio", err: "Bio must be less than 50 characters" });
//     }

//     const hashPassword = await bcrypt.hash(password, 10);

//     const createUser = await userModel.create({
//       name: name,
//       email: email,
//       password: hashPassword,
//       bio: bio || null,
//       role: role,
//       phone: phone,
//     });

//     const token = jwt.sign(
//       createUser.dataValues.id,
//       process.env.JWT_SECRET_TOKEN
//     );
//     return res.status(201).json({
//       user: {
//         id: createUser.dataValues.id,
//         email: createUser.dataValues.email,
//         name: createUser.dataValues.name,
//         bio: createUser.dataValues.bio,
//         token: token,
//       },
//       msg: "User Created Successfully",
//     });
//   } catch (error) {
//     console.log("Error in createUser:", error);
//     res.status(500).json({ err: error.message });
//   }
// };

const createUser = async (req, res) => {
  const { email, name, password, bio, role, phone } = req.body;
  const phonePattern = /^[0-9]{10}$/;

  try {
    // Validate email format and length
    if (!emailValidator.validate(email) || email.length > 50) {
      return res
        .status(400)
        .json({ type: "email", err: "Please Enter a Valid Email" });
    }
    if (email.length < 12) {
      return res.status(400).json({
        type: "email",
        err: "Email must contain at least 12 characters",
      });
    }

    // Check if the email already exists
    const findUser = await userModel.findOne({ where: { email: email } });
    if (findUser) {
      return res
        .status(409)
        .json({ type: "email", err: "Email Already Exists" });
    }

    // Validate phone number format
    if (phone && !phonePattern.test(phone)) {
      return res
        .status(400)
        .json({ type: "phone", err: "Please Enter a Valid Phone Number" });
    }

    // Validate password strength and length
    if (passwordStrength(password).id < 2) {
      return res
        .status(400)
        .json({ type: "password", err: "Please Enter a Strong Password" });
    } else if (password.length < 6 || password.length > 20) {
      return res.status(400).json({
        type: "password",
        err: "Password must be between 6 and 20 characters",
      });
    }

    // Validate bio length
    if (bio && bio.length > 70) {
      return res
        .status(400)
        .json({ type: "bio", err: "Bio must be less than 70 characters" });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const createUser = await userModel.create({
      name: name,
      email: email,
      password: hashPassword,
      bio: bio || null,
      role: role,
      phone: phone,
    });

    // Generate JWT token for the new user
    const token = jwt.sign(
      createUser.dataValues.id,
      process.env.JWT_SECRET_TOKEN
    );

    // Send response with user data and token
    res.status(201).json({
      msg: "User created successfully!",
      user: createUser,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Server Error. Please try again later." });
  }
};

//login

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.file);

  try {
    const findUser = await userModel.findOne({
      where: {
        email: email,
      },
    });

    if (!findUser) {
      return res.status(404).json({ err: "Invalid Email" });
    }

    const checkPassword = await bcrypt.compare(
      password,
      findUser.dataValues.password
    );

    if (!checkPassword) {
      return res.status(401).json({ err: "Wrong Password" });
    }

    const token = jwt.sign(
      findUser.dataValues.id,
      process.env.JWT_SECRET_TOKEN
    );
    res.status(200).json({
      data: {
        id: findUser.dataValues.id,
        name: findUser.dataValues.name,
        email: findUser.dataValues.email,
        bio: findUser.dataValues.bio,
        token: token,
      },
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

//get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.findAll({
      attributes: {
        exclude: ["password"],
      },
    });
    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getPersonalDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const personalDetails = await userModel.findByPk(id, {
      attributes: {
        exclude: ["password"],
      },
    });

    if (!personalDetails) {
      return res.status(404).json({ err: "User not-found" });
    }
    res.render("user/index", {
      data: personalDetails.dataValues,
      id: personalDetails.dataValues.id,
      title: "Personal Details",
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getPersonBlogs = async (req, res) => {
  const { id } = req.params;
  try {
    const blogs = await blogModel.findAll({
      where: {
        author: id,
      },
      include: [
        {
          model: blogCommentModel,
          as: "comments",
        },
      ],
    });

    if (req?.query?.publish) {
      console.log("yes");
      const updateBlog = await blogModel.update(
        {
          is_published: req?.query?.publish == "true" ? false : true,
        },
        {
          where: {
            id: req?.query?.id,
          },
        }
      );
      res.redirect(`/admin/user/${id}/blogs`);
      return;
    }
    if (req?.query?.premium) {
      console.log("yes");
      const updateBlog = await blogModel.update(
        {
          premium: req?.query?.premium == "true" ? false : true,
        },
        {
          where: {
            id: req?.query?.id,
          },
        }
      );
      res.redirect(`/admin/user/${id}/blogs`);
      return;
    }

    const author = await userModel.findByPk(id);

    res.render("user/blogs", {
      data: blogs,
      title: "Blogs List",
      name: author.dataValues.name,
      id: id,
      query: {},
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

const getPersonForums = async (req, res) => {
  const { id } = req.params;
  try {
    if (req?.query?.status) {
      await forumModel.update(
        {
          status: req?.query?.status,
        },
        {
          where: {
            id: req.query?.id,
          },
        }
      );

      return res.redirect(`/admin/user/${id}/forums`);
    }

    const forums = await forumModel.findAll({
      where: {
        author: id,
      },
    });
    const author = await userModel.findByPk(id);

    res.render("user/forums", {
      data: forums,
      title: "Forums List",
      id: id,
      name: author.dataValues.name,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
};

module.exports = {
  createUser,
  login,
  getAllUsers,
  getPersonalDetails,
  getPersonBlogs,
  getPersonForums,
};
