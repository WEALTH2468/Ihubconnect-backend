const express = require("express");
const auth = require("../../middlewares/auth");
const {
  getObjectives,
  addObjective,
  updateObjective,
  getObjective,
  deleteObjective,
  archiveObjective,
} = require("../../controllers/iperformance/objective");

const router = express.Router();

router.get("/", auth, getObjectives);
router.get("/:id", auth, getObjective);
router.post("/", auth, addObjective);
router.patch("/archive-objectives", auth, archiveObjective);
router.patch("/:id", auth, updateObjective);
router.delete("/", auth, deleteObjective);

module.exports = { basePath: "/iperformance/objectives", routes: router };
