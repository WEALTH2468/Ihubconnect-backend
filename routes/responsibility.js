const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const responsibilityCtrl = require('../controllers/responsibility');

router.get('/:roleId', auth, responsibilityCtrl.getResponsibilities);
router.post('/', auth, responsibilityCtrl.addResponsibility);
router.delete('/:ids', auth, responsibilityCtrl.deleteResponsibility);
router.patch('/:id', auth, responsibilityCtrl.updateResponsibility);

module.exports = router;
