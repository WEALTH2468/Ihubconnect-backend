const express = require('express');
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config');

const router = express.Router();
const itemCtrl = require('../controllers/item');

router.get('/', auth, itemCtrl.getItems);
router.get('/:id', auth, itemCtrl.getItem);
router.post('/', auth, itemCtrl.addItem);
router.delete('/', auth, itemCtrl.deleteItem);
router.patch('/:id', auth, multer, itemCtrl.updateItem);

module.exports = router;
