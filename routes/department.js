const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const departmentCtrl = require('../controllers/department');

router.get('/', auth, departmentCtrl.getDepartments);
router.post('/', auth, departmentCtrl.addDepartment);
router.delete('/:id', auth, departmentCtrl.deleteDepartment);
router.patch('/:id', auth, departmentCtrl.updateDepartment);

module.exports = router;
