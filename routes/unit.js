const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const unitCtrl = require('../controllers/unit');

router.get('/', auth, unitCtrl.getUnits);
router.post('/', auth, unitCtrl.addUnit);
router.delete('/:id', auth, unitCtrl.deleteUnit);
router.patch('/:id', auth, unitCtrl.updateUnit);

module.exports = router;
