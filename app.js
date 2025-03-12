const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const { differenceInDays } = require('date-fns');
const Role = require("./models/rbac/role");
const Chat = require("./models/chat");

const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const commentRoutes = require("./routes/comment");
const notificationRoutes = require("./routes/notification");
const roleRoutes = require("./routes/rbac/role");
const permissionRoutes = require("./routes/rbac/permission");

const settingsRoutes = require("./routes/settings");
const messageRoutes = require("./routes/message");

const User = require("./models/user");
const Comment = require("./models/comment");
const Post = require("./models/post");
const Notification = require("./models/notification");
const UnsentNotification = require("./models/unsentNotification");

// utils
const {
  createDefaultRolesIfAbsent,
  createDefaultPermissionsIfAbsent,
} = require("./lib/iperformance/general-utils");

function connectToDatabase() {
  // updateUsers()
  // updateNotifications()
  // updateunsentNotifications()
  // updateComment()
  // updatePost()
  // updateDocument()
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.localConnect, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4,
      })
      .then(async () => {
        await createDefaultRolesIfAbsent();
        // await generateChat()
        console.log("Connected to local MongoDB");
        resolve();
      })
      .catch((error) => {
        console.error("Failed to connect to local MongoDB:", error.message);
        console.log("Trying fallback connection...");

        mongoose
          .connect(process.env.remoteDeployment, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          })
          .then(async () => {
            console.log("Connected to remote MongoDB");
            await createDefaultRolesIfAbsent();
            resolve();
          })
          .catch((fallbackError) => {
            console.error(
              "Failed to connect to fallback MongoDB:",
              fallbackError.message
            );
            reject(fallbackError);
          });
      });
  });
}

connectToDatabase();

app.use(
  cors({
    origin: process.env.frontend_domain,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "iHub Connect 1.0.0.3 - MVP Release : (iPerformance) Febuary 3 2025",
  });
});

// Different files upload storage
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  "/document-library",
  express.static(path.join(__dirname, "document-library"))
);
app.use("/logo", express.static(path.join(__dirname, "logo")));
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/ihub", userRoutes);
app.use("/notifications", notificationRoutes);
app.use("/roles", roleRoutes);
app.use("/settings", settingsRoutes)
app.use("/chat", messageRoutes);
app.use("/permissions", permissionRoutes)


module.exports = app;
