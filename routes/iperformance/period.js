const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const periodCtrl = require("../../controllers/iperformance/period");

router.post("/", auth, periodCtrl.addPeriod);
router.delete("/", auth, periodCtrl.deletePeriod);
router.patch("/:id", auth, periodCtrl.updatePeriod);
router.patch("/:id/complete", auth, periodCtrl.completePeriod);
router.get("/", auth, periodCtrl.getPeriods);
router.get("/:id", auth, periodCtrl.getPeriod);

module.exports = { basePath: "/iperformance/periods", routes: router };
