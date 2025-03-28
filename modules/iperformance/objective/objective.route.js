const express = require("express");
const auth = require("../../../middlewares/auth");
const objectiveController = require("../../iperformance/objective/objective.controller");
const tenantContext = require("../../../middlewares/tenant-context");
const router = express.Router();

router.get("/", auth, tenantContext, objectiveController.getObjectives);
router.get("/:id", auth, tenantContext, objectiveController.getObjective);
router.post("/", auth, tenantContext, objectiveController.createObjective);
router.patch(
  "/archive-objectives",
  auth,
  tenantContext,
  objectiveController.archiveObjectives
);
router.patch("/:id", auth, tenantContext, objectiveController.updateObjective);
router.delete("/", auth, tenantContext, objectiveController.deleteObjective);

module.exports = router;
