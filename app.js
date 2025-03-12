const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const { differenceInDays } = require("date-fns");
const Role = require("./models/rbac/role");
const Chat = require("./models/chat");

const userRoutes = require("./routes/user");
const customerRoutes = require("./routes/customer");
const postRoutes = require("./routes/post");
const commentRoutes = require("./routes/comment");
const notificationRoutes = require("./routes/notification");
const roleRoutes = require("./routes/rbac/role");
const permissionRoutes = require("./routes/rbac/permission");

const settingsRoutes = require("./routes/settings");
const messageRoutes = require("./routes/message");
const quoteRoutes = require("./routes/quote");
const itemRoutes = require("./routes/item");
// category routes
const categoryRoutes = require("./routes/category");

const User = require("./models/user");
const Comment = require("./models/comment");
const Post = require("./models/post");
const Document = require("./models/document");
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

  console.log(process.env.frontend_domain.split(","));
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.localConnect, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4,
      })
      .then(async () => {
        // await generateChat()
        console.log("Connected to local MongoDB");
        await createDefaultRolesIfAbsent();
        await createDefaultWeights();
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
            //await createDefaultWeights();
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
    origin: process.env.frontend_domain.split(","), // allow to server to accept request from different origin
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
app.use("/documents", documentRoutes);
app.use("/ihub", userRoutes);
app.use("/notifications", notificationRoutes);
app.use("/roles", roleRoutes);
app.use("/settings", settingsRoutes);
app.use("/departments", departmentRoutes);
app.use("/units", unitRoutes);
app.use("/feedbacks", feedbackRoutes);
app.use("/room", roomRoutes);
app.use("/chat", messageRoutes);
app.use("/reaction", reactionRoutes);
app.use("/readReceipt", readReceiptRoutes);
app.use("/customers", customerRoutes);
app.use("/course", courseRoutes);
app.use("/lesson", lessonRoutes);
app.use("/quiz", quizRoutes);
app.use("/quotes", quoteRoutes);
app.use("/items", itemRoutes);
app.use("/permissions", permissionRoutes);
app.use("/move-data", require("./routes/moveRoute"));
// category
app.use("/category", categoryRoutes);

//Performance
iperformanceRoutes.forEach((route) => {
  app.use(route.basePath, route.routes);
});

// Dashboard
app.use("/dashboard", dashboardRoutes);

//team
app.use("/team", teamRoutes);
app.use("/teammate", teammateRoutes);
app.use("/settings/attachmentType", attachmentTypeRoutes);
app.use("/time/attendant", attendantRoutes);
app.use("/settings/responsibility", responsibilityRoutes);
app.use("/checkIn", checkInRoutes);
app.use("/settings/job-positions", jobPositionRoutes);
app.use("/settings/weights", weightRoutes);

async function updateUsers() {
  const users = await User.find({});

  for (let user of users) {
    let updated = false;

    if (user?.avatar) {
      user.avatar = "";
      updated = true;
    }

    if (user?.background) {
      user.background = "";
      updated = true;
    }

    if (updated) {
      await user.save();
      console.log(`User ${user._id} updated successfully`);
    }
  }
}

async function updateNotifications() {
  const notifications = await Notification.find({});

  for (let notification of notifications) {
    let updated = false;

    if (
      notification?.image?.includes("http://www.izone5_api.ihubconnect.com")
    ) {
      notification.image = notification.image.replace(
        "http://www.izone5_api.ihubconnect.com",
        ""
      );
      updated = true;
    }

    if (updated) {
      await notification.save();
      console.log(`Notification ${notification._id} updated successfully`);
    }
  }
}

async function updateunsentNotifications() {
  const unsentNotifications = await UnsentNotification.find({});

  for (let notification of unsentNotifications) {
    let updated = false;

    if (
      notification?.image?.includes("http://www.izone5_api.ihubconnect.com")
    ) {
      notification.image = notification.image.replace(
        "http://www.izone5_api.ihubconnect.com",
        ""
      );
      updated = true;
    }

    if (updated) {
      await notification.save();
      console.log(`Notification ${notification._id} updated successfully`);
    }
  }
}

async function updateComment() {
  const comments = await Comment.find({}).lean();

  const updateTasks = comments.map(async (comment) => {
    let updated = false;

    if (
      comment?.user &&
      comment.user.avatar &&
      comment.user.avatar.includes("http://www.izone5_api.ihubconnect.com")
    ) {
      comment.user.avatar = comment.user.avatar.replace(
        "http://www.izone5_api.ihubconnect.com",
        ""
      );
      updated = true;
    }

    if (updated) {
      await Comment.updateOne({ _id: comment._id }, comment);
      console.log(`Comment ${comment._id} updated successfully`);
    }
  });

  await Promise.all(updateTasks);
}

async function updatePost() {
  const posts = await Post.find({}).lean();

  const updateTasks = posts.map(async (post) => {
    let updated = false;

    if (
      post?.picture ||
      (post?.user &&
        post.user.avatar &&
        post.user.avatar.includes("http://www.izone5_api.ihubconnect.com"))
    ) {
      post.user.avatar = post.user.avatar.replace(
        "http://www.izone5_api.ihubconnect.com",
        ""
      );
      post.picture = post.picture.replace(
        "http://www.izone5_api.ihubconnect.com",
        ""
      );

      updated = true;
    }

    if (updated) {
      await Post.updateOne({ _id: post._id }, post);
      console.log(`Post ${post._id} updated successfully`);
    }
  });

  await Promise.all(updateTasks);
}

async function updateDocument() {
  const documents = await Document.find({}).lean();

  console.log({ documents });

  const updateTasks = documents.map(async (document) => {
    let updated = false;

    if (document?.files && Array.isArray(document.files)) {
      document.files = document.files.map((fileObj) => {
        if (
          fileObj.file &&
          fileObj.file.includes("http://www.mudiame-api.ihubconnect.com")
        ) {
          fileObj.file = fileObj.file.replace(
            "http://www.mudiame-api.ihubconnect.com",
            ""
          );
          updated = true;
        }
        return fileObj;
      });
    }

    if (updated) {
      await Document.updateOne({ _id: document._id }, document);
      console.log(`Document ${document._id} updated successfully`);
    }
  });

  await Promise.all(updateTasks);
}

async function createDefaultWeights() {
  const requiredWeights = [
    { name: "Task", icon: "#007BFF" },
    { name: "Report", icon: "#6C757D" },
  ];

  const existingWeights = await Weight.find({
    name: { $in: requiredWeights.map((w) => w.name) },
  });
  const weightMap = new Map(
    existingWeights.map((weight) => [weight.name, weight._id])
  );

  for (const { name, icon } of requiredWeights) {
    if (!weightMap.has(name)) {
      const newWeight = await Weight.create({
        name,
        value: 1,
        icon,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      weightMap.set(name, newWeight._id);
    }
  }
}

module.exports = app;
