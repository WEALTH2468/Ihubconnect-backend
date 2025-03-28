const express = require('express');
const router = express.Router();
const checkInCtrl = require('../controllers/checkIn');
const multer = require('../middlewares/multer-config');




router.get('/users', checkInCtrl.getUsers);
router.get('/isUserCheckedInToday', checkInCtrl.getIsUserCheckedInToday);
router.post('/attendant', multer, checkInCtrl.addAttendant);
router.patch('/:id', multer, checkInCtrl.updateAttendant);

module.exports = router;
