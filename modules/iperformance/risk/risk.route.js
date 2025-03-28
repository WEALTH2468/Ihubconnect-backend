const express = require("express");
const auth = require("../../../middlewares/auth");
const router = express.Router();
const riskController = require("./risk.controller");
const {
  createRiskValidation,
  getRiskValidation,
} = require("./risk.validation");
const validate = require("../../../middlewares/validate");

router.post(
  "/",
  auth,
  createRiskValidation,
  validate,
  riskController.createRisk
);
router.get("/", auth, riskController.getRisks);
router.get("/:id", auth, getRiskValidation, validate, riskController.getRisk);
router.delete("/", auth, riskController.deleteRisk);
module.exports = router;
