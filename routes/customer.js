const express = require('express');
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config');

const router = express.Router();
const customerCtrl = require('../controllers/customer');


router.get('/', auth, customerCtrl.getCustomers);
router.get('/:id', auth, customerCtrl.getCustomer);
router.post('/', auth, customerCtrl.addCustomer);
router.delete('/', auth, customerCtrl.deleteCustomer);
router.patch('/:id', auth, multer, customerCtrl.updateCustomer);
router.delete('/contacts/:id', auth, customerCtrl.deleteContacts);
router.patch('/:customerId/contacts/:contactId', auth, customerCtrl.updateCustomerContact);


module.exports = router;
