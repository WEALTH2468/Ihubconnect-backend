const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const lessonCtrl = require('../controllers/lesson');

router.get('/', auth, lessonCtrl.getLessons);
router.get('/:id', auth, lessonCtrl.getLesson);
router.post('/', auth, lessonCtrl.addLesson);
router.patch('/:id', auth, lessonCtrl.updateLesson);
router.delete('/:id', auth, lessonCtrl.deleteLesson);

module.exports = router;
