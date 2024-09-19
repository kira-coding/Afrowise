const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  let adminToken = req.cookies.admin;

  if (!adminToken) {
    return res.status(403).send("Not allowed");
  }

  try {
    let admin = jwt.decode(adminToken, config.get("JWT-secret-key"));
    if (!admin) {
      return res.status(403).send("Not allowed");
    }
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(403).send("Not allowed");
  }
};