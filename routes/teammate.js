const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const multer = require('../middlewares/multer-config');
const teammateCtrl = require('../controllers/teammate');

router.get('/download/:filename',auth, teammateCtrl.downloadFile);
router.get('/',auth, teammateCtrl.getTeammates);
router.get('/:id',auth, teammateCtrl.getTeammate);
router.post('/',auth, multer, teammateCtrl.addTeammate);
router.delete('/:ids', auth,teammateCtrl.deleteTeammate);
router.patch('/:id', auth, multer, teammateCtrl.updateTeammate);

module.exports = router;