const { body, param } = require("express-validator");

const createRiskValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("status").notEmpty().withMessage("Status is required"),
];

const getRiskValidation = [
  param("id")
    .notEmpty()
    .withMessage("Risk ID is required")
    .isMongoId()
    .withMessage("Risk ID must be a valid MongoDB ObjectId"),
];

module.exports = {
  createRiskValidation,
  getRiskValidation,
};
