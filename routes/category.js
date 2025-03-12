const express = require("express");
const auth = require("../middlewares/auth");

const router = express.Router();
const categoryCtrl = require("../controllers/category");

router.get("/", auth, categoryCtrl.getCategories);
router.get("/:id", auth, categoryCtrl.getCategory);
router.post("/", auth, categoryCtrl.addCategory);
router.delete("/", auth, categoryCtrl.deleteCategory);
router.patch("/:id", auth, categoryCtrl.updateCategory);

module.exports = router;
