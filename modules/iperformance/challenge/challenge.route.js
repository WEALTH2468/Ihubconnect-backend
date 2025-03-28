const express = require("express");
const auth = require("../../../middlewares/auth");
const router = express.Router();
const challengeController = require("./challenge.controller");
const {
  createChallengeValidation,
  getChallengeValidation,
} = require("./challenge.validation");
const validate = require("../../../middlewares/validate");

router.post(
  "/",
  auth,
  createChallengeValidation,
  validate,
  challengeController.createChallenge
);
router.get("/", auth, challengeController.getChallenges);
router.get(
  "/:id",
  auth,
  getChallengeValidation,
  validate,
  challengeController.getChallenge
);
router.delete("/", auth, challengeController.deleteChallenge);
module.exports = router;
