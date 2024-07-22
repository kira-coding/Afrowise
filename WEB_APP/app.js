// library imports
const express = require("express");
const bodyParser = require("body-parser");
const config = require("config");
const cookieParser = require("cookie-parser");
const path = require("path");
const publicRoute = require("./routes/public");
const courseRoute = require("./routes/course");
const userRoute = require("./routes/users");
const fileUpload = require("express-fileupload");
const app = express();
require("./db")(); //database initializations.
app.set("view engine", "ejs");

//middlewares
app.use(fileUpload());
app.use(express.static("statics"));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routes middleware setups

app.use("/", publicRoute);
app.use("/api/courses", courseRoute);
app.use("/user/", userRoute);

//server

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});

// Route imports
