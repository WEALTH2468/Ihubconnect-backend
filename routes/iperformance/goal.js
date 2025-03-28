const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const goalCtrl = require("../../controllers/iperformance/goal");

router.post("/", auth, goalCtrl.addGoal);
router.delete("/", auth, goalCtrl.deleteGoal);
router.patch("/archive-goals", auth, goalCtrl.archiveGoal);
router.patch("/:id", auth, goalCtrl.updateGoal);
router.get("/", auth, goalCtrl.getGoals);
router.get("/:id", auth, goalCtrl.getGoal);

module.exports = { basePath: "/iperformance/goals", routes: router };
