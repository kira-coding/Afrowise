const jwt = require("jsonwebtoken");
const config = require("config");
module.exports = function (req, res, next) {
  let student;

  student = jwt.verify(req.cookies.student, config.get("JWT-secret-key"));

  if(!student) return res.status(403).send("Not allowed");
  req.student=student
  next()

  
};
