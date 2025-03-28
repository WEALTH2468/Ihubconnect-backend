const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const courseCtrl = require('../controllers/course');

router.get('/', auth, courseCtrl.getCourses);
router.get('/:id', auth, courseCtrl.getCourse);
router.post('/', auth, courseCtrl.addCourse);
router.patch('/:id', auth, courseCtrl.updateCourse);
router.delete('/:id', auth, courseCtrl.deleteCourse);

module.exports = router;
