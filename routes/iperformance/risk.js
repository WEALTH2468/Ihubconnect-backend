const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const riskCtrl = require("../../controllers/iperformance/risk");

router.get("/", auth, riskCtrl.getRisks);
router.get("/:id", auth, riskCtrl.getRisk);
router.post("/", auth, riskCtrl.addRisk);
router.delete("/", auth, riskCtrl.deleteRisk);
router.patch("/:id", auth, riskCtrl.updateRisk);

module.exports = { basePath: "/iperformance/risks", routes: router };