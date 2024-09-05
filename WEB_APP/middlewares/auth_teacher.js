const jwt = require("jsonwebtoken");
const config = require("config");
module.exports = function (req, res, next) {
  let teacher;

  teacher = jwt.decode(req.cookies.teacher, config.get("JWT-secret-key"));

  if(!teacher) return res.status(403).send("Not allowed");
  req.teacher=teacher
  next()

  
};
