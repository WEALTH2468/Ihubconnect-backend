const express = require("express");
const auth = require("../../../middlewares/auth");
const router = express.Router();
const periodController = require("./period.controller");
const {
  createPeriodValidation,
  getPeriodValidation,
} = require("./period.validation");
const validate = require("../../../middlewares/validate");

router.post(
  "/",
  auth,
  createPeriodValidation,
  validate,
  periodController.createPeriod
);
router.get("/", auth, periodController.getPeriods);
router.patch("/:id", auth, periodController.updatePeriod);
router.get(
  "/:id",
  auth,
  getPeriodValidation,
  validate,
  periodController.getPeriod
);
router.delete("/", auth, periodController.deletePeriod);
module.exports = router;
