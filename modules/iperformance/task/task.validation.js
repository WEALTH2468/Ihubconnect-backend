const { body, param } = require("express-validator");

const createTaskValidation = [
  body("title").notEmpty().withMessage("Title is required"),

  body("weight")
    .notEmpty()
    .withMessage("Weight is required")
    .isMongoId()
    .withMessage("Weight must be a valid MongoDB ObjectId"),

  body("owner")
    .notEmpty()
    .withMessage("Owner is required")
    .isArray()
    .withMessage("Owner must be an array"),

  body("status").notEmpty().withMessage("Status is required"),
];

const createSubtaskValidation = [
  ...createTaskValidation,
  body("parentId")
    .notEmpty()
    .withMessage("Parent ID is required")
    .isMongoId()
    .withMessage("Parent ID must be a valid MongoDB ObjectId"),
  body("parentStatus").notEmpty().withMessage("Parent Status is required"),
  body("progress").notEmpty().isNumeric().withMessage("Progress is required"),
];

const getTaskValidation = [
  param("id")
    .notEmpty()
    .withMessage("Task ID is required")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
];

const moveTaskValidation = [
  body("ids")
    .isArray({ min: 1 })
    .withMessage("Task IDs must be a non-empty array"),
  body("ids.*")
    .notEmpty()
    .withMessage("Each Task ID is required")
    .isMongoId()
    .withMessage("Each Task ID must be a valid MongoDB ObjectId"),
];

module.exports = {
  createTaskValidation,
  createSubtaskValidation,
  getTaskValidation,
  moveTaskValidation,
};
