const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const attachmentTypeCtrl = require('../controllers/attachmentType');



router.get('/',auth, attachmentTypeCtrl.getAttachmentTypes);
router.post('/',auth, attachmentTypeCtrl.addAttachmentType);
router.delete('/:ids', auth, attachmentTypeCtrl.deleteAttachmentType);
router.patch('/:id', auth, attachmentTypeCtrl.updateAttachmentType);

module.exports = router;