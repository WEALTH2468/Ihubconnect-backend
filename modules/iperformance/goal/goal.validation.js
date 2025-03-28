const { body, param } = require("express-validator");

const createGoalValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("status").notEmpty().withMessage("Status is required"),
];

const getGoalValidation = [
  param("id")
    .notEmpty()
    .withMessage("Goal ID is required")
    .isMongoId()
    .withMessage("Goal ID must be a valid MongoDB ObjectId"),
];

module.exports = {
  createGoalValidation,
  getGoalValidation,
};
