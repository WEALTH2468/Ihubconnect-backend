const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const feedbackCtrl = require('../controllers/feedback');

router.post('/', auth, feedbackCtrl.addFeedback);

module.exports = router;
