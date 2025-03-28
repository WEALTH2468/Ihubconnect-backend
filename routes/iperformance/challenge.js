const express = require("express");
const challengeCtrl = require("../../controllers/iperformance/challenge");
const auth = require("../../middlewares/auth");
const router = express.Router();

router.post("/", auth, challengeCtrl.addChallenge);
router.get("/", auth, challengeCtrl.getChallenges);
router.get("/:id", auth, challengeCtrl.getChallenge);
router.patch("/:id", auth, challengeCtrl.updateChallenge);
router.delete("/", auth, challengeCtrl.deleteChallenge);

module.exports = { basePath: "/iperformance/challenges", routes: router };
