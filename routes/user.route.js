const { createUser, login } = require("../controller/user.controller");

const express = require("express");
const router = express.Router();

router.post("/create", createUser);
router.post("/login", login);

module.exports = router;
