const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const dashboardCtrl = require("../../controllers/dashboard/iperformance");

router.get("/iperformance/summary", auth, dashboardCtrl.getSummary);
router.get("/iperformance/progress", auth, dashboardCtrl.getProgress);
router.get("/iperformance/workload", auth, dashboardCtrl.getWorkload);
router.get("/iperformance/top-users", auth, dashboardCtrl.getTopUsers);
router.get("/iperformance/top-teams", auth, dashboardCtrl.getTopTeams);
router.get("/iperformance/top-goals", auth, dashboardCtrl.getTopGoals);
router.get(
  "/iperformance/top-objectives",
  auth,
  dashboardCtrl.getTopObjectives
);
module.exports = router;
