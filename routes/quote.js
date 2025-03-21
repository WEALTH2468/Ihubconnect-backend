const express = require('express');
const auth = require('../middlewares/auth');

const router = express.Router();
const quoteCtrl = require('../controllers/quote');

router.get('/', auth, quoteCtrl.getQuotes);
router.get('/:id', auth, quoteCtrl.getQuote);
router.post('/', auth, quoteCtrl.addQuote);
router.delete('/', auth, quoteCtrl.deleteQuote);
router.patch('/:id', auth, quoteCtrl.updateQuote);
module.exports = router;
