const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const attendantCtrl = require('../controllers/attendant');
const multer = require('../middlewares/multer-config');

router.get('/', auth, attendantCtrl.getAttendant);
router.get('/today', auth, attendantCtrl.getTodayAttendants);
router.get('/date', auth, attendantCtrl.getAttendantsByDate);
router.get('/isUserCheckedInToday', auth, attendantCtrl.getIsUserCheckedInToday);
router.post('/', auth, multer, attendantCtrl.addAttendant);
router.patch('/:id', auth, multer, attendantCtrl.updateAttendant);

module.exports = router;
