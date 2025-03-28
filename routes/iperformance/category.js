const express = require("express");
const auth = require("../../middlewares/auth");
const router = express.Router();
const categoryCtrl = require("../../controllers/iperformance/category");

router.post("/", auth, categoryCtrl.createCategory);
router.delete("/", auth, categoryCtrl.deleteCategory);
router.patch("/:id", auth, categoryCtrl.updateCategory);
router.get("/", auth, categoryCtrl.getAllCategories);
router.get("/:id", auth, categoryCtrl.getCategoryById);

module.exports = { basePath: "/iperformance/category", routes: router };
