const express = require("express");
const auth = require("../../../middlewares/auth");
const goalController = require("../../iperformance/goal/goal.controller");
const tenantContext = require("../../../middlewares/tenant-context");
const router = express.Router();

router.get("/", auth, tenantContext, goalController.getGoals);
router.get("/:id", auth, tenantContext, goalController.getGoal);
router.post("/", auth, tenantContext, goalController.createGoal);
router.patch("/archive-goals", auth, tenantContext, goalController.archiveGoal);
router.patch("/:id", auth, tenantContext, goalController.updateGoal);
router.delete("/", auth, tenantContext, goalController.deleteGoal);

module.exports = router;
