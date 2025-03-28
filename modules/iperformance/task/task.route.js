const express = require("express");
const auth = require("../../../middlewares/auth");
const router = express.Router();
const taskController = require("./task.controller");
const {
  createTaskValidation,
  createSubtaskValidation,
  getTaskValidation,
  moveTaskValidation,
} = require("./task.validation");
const validate = require("../../../middlewares/validate");
const tenantContext = require("../../../middlewares/tenant-context");

router.post(
  "/",
  auth,
  tenantContext,
  createTaskValidation,
  validate,
  taskController.createTask
);

router.post("/subtask", auth, tenantContext, taskController.createSubtask);

router.delete("/", auth, tenantContext, taskController.deleteTask);

router.patch(
  "/move",
  auth,
  tenantContext,
  // moveTaskValidation,
  validate,
  taskController.moveTasks
);

router.patch(
  "/archive-tasks",
  auth,
  tenantContext,
  taskController.archiveTasks
);

router.patch(
  "/:id",
  auth,
  tenantContext,
  getTaskValidation,
  validate,
  taskController.updateTask
);

router.get("/", auth, tenantContext, taskController.getTasks);

router.get(
  "/:id",
  auth,
  tenantContext,
  getTaskValidation,
  validate,
  taskController.getTask
);

router.get(
  "/count/user/:id",
  auth,
  tenantContext,
  getTaskValidation,
  validate,
  taskController.countUserTasks
);

module.exports = router;
