const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const weightCtrl = require("../controllers/weight");

router.get("/all", auth, weightCtrl.getAllWeights);
router.post("/", auth, weightCtrl.addWeight);
router.delete("/", auth, weightCtrl.deleteWeight);
router.patch("/:id", auth, weightCtrl.updateWeight);
router.get("/", auth, weightCtrl.getWeights);

module.exports = router;
