const { Op } = require("sequelize");
const redirectionModel = require("../models/redirect/redirect.model");

const redirection = async (req, res, next) => {
  console.log(req.url);
  // const findRedirections = await redirectionModel.findOne({
  //   where: {
  //     redirect_from: {
  //       [Op.startsWith]: req.url,
  //     },
  //   },
  // });
  // if (findRedirections) {
  //   console.log('yes');
  //   res.redirect(`${findRedirections.dataValues.redirect_to}`, 301);
  //   return;
  // }
  next();
};

module.exports = redirection;
