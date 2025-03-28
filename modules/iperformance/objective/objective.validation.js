const { body, param } = require("express-validator");

const createObjectiveValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("status").notEmpty().withMessage("Status is required"),
];

const getObjectiveValidation = [
  param("id")
    .notEmpty()
    .withMessage("Objective ID is required")
    .isMongoId()
    .withMessage("Objective ID must be a valid MongoDB ObjectId"),
];

module.exports = {
  createObjectiveValidation,
  getObjectiveValidation,
};
