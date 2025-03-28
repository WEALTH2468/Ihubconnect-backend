const { body, param } = require("express-validator");

const createChallengeValidation = [
  body("title").notEmpty().withMessage("Title is required"),
  body("status").notEmpty().withMessage("Status is required"),
];

const getChallengeValidation = [
  param("id")
    .notEmpty()
    .withMessage("Challenge ID is required")
    .isMongoId()
    .withMessage("Challenge ID must be a valid MongoDB ObjectId"),
];

module.exports = {
  createChallengeValidation,
  getChallengeValidation,
};
