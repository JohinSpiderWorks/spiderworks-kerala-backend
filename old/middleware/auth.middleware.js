const { verifyToken } = require("../utils/verifyToken");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const adminModel = require("../models/admin.model");

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ err: "Unauthorized Access: Token missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ err: "Unauthorized Access: Token invalid" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

    // if your JWT payload is { id: user.id }, then:
    const userId = decoded?.id;
    if (!userId) {
      return res.status(401).json({ err: "Unauthorized Access: Invalid token payload" });
    }

    const findUser = await userModel.findByPk(userId, {
      attributes: ["id", "name", "email", "bio"],
    });

    if (!findUser) {
      return res.status(401).json({ err: "Unauthorized Access: User not found" });
    }

    req.user = findUser.dataValues;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ err: "Something went wrong during authentication" });
  }
};

// const adminAuth = async (req, res, next) => {
//   try {
//     if (req?.cookies?.admin) {
//       const id = jwt.verify(req?.cookies?.admin, process.env.JWT_SECRET_TOKEN);
//       const findAdmin = await userModel.findOne({
//         where: {
//           id: id,
//           role: "admin",
//         },

//         attributes: ["name", "email", "id"],
//       });
//       if (!findAdmin) {
//         // return res.status(401).json({ err: "UnAuthorized Acess" });
//         res.redirect("/admin/login");
//       }
//       req.user = findAdmin.dataValues;
//       console.log(req.user);
//       next();
//       // }
//     } else {
//       console.log("Cookies:", req.cookies);

//       // return res.status(401).json({ err: "UnAuthorized Acess" });
//       console.log("working");
//       return res.redirect("/admin/login");
//     }
//   } catch (error) {
//     res.status(500).json({ err: error.message });
//   }
// };

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenFromCookie = req.cookies?.admin;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      console.log("No token provided", { headers: req.headers, cookies: req.cookies });
      return res.status(401).json({ err: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

    if (!decoded?.id) {
      return res.status(401).json({ err: "Unauthorized: Invalid token payload" });
    }

    const findAdmin = await userModel.findOne({
      where: { id: decoded.id, role: "admin" },
      attributes: ["id", "name", "email"],
    });

    if (!findAdmin) {
      console.log("Admin not found for token:", decoded);
      return res.status(401).json({ err: "Unauthorized: Invalid token" });
    }

    req.user = findAdmin.dataValues;
    console.log("Authenticated Admin:", req.user);

    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ err: "Unauthorized: Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ err: "Unauthorized: Token expired" });
    }
    return res.status(500).json({ err: "Server error during authentication" });
  }
};

module.exports = { userAuth, adminAuth };
