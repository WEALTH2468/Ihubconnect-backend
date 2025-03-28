const { body, param } = require("express-validator");

const createPeriodValidation = [
  body("name").notEmpty().withMessage("Name is required"),
];

const getPeriodValidation = [
  param("id").notEmpty().withMessage("Period ID is required"),
];

module.exports = {
  createPeriodValidation,
  getPeriodValidation,
};
