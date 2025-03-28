const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const taskCtrl = require("../../controllers/iperformance/task");

router.post("/", auth, taskCtrl.addTask);
router.delete("/", auth, taskCtrl.deleteTask);
router.patch("/archive-tasks", auth, taskCtrl.archiveTask);
router.patch("/move", auth, taskCtrl.moveTask);
router.patch("/:id", auth, taskCtrl.updateTask);
router.get("/", auth, taskCtrl.getTasks);
router.get("/:id", auth, taskCtrl.getTask);
router.get("/count/user/:id", auth, taskCtrl.getTaskCount);

module.exports = { basePath: "/iperformance/tasks", routes: router };
