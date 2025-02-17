const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const multer = require('../middlewares/multer-config');
const settingsCtrl = require("../controllers/settings")


router.patch('/logo', auth, multer, settingsCtrl.updateLogo)
router.get('/logo', settingsCtrl.getLogo)

module.exports = router;