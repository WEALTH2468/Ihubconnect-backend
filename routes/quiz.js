const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const quizCtrl = require('../controllers/quiz');

router.get('/', auth, quizCtrl.getQuizs);
router.get('/:id', auth, quizCtrl.getQuiz);
router.post('/', auth, quizCtrl.addQuiz);
router.patch('/:id', auth, quizCtrl.updateQuiz);
router.delete('/:id', auth, quizCtrl.deleteQuiz);

module.exports = router;
