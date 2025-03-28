const express = require("express");
const router = express.Router();
const moveCtrl = require("../controllers/moveCtrl");

router.patch("/", moveCtrl.moveData);
router.patch("/refresh-permissions", moveCtrl.resetPermissions);

module.exports = router;
