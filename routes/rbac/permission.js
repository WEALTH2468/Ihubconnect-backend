const express = require('express');
const auth = require('../../middlewares/auth');
const router = express.Router();
const permissionCtrl = require('../../controllers/rbac/permission');

router.get('/', auth, permissionCtrl.getPermissions);
router.get('/role/:id', auth, permissionCtrl.getPermissionsForRole);
router.post('/', auth, permissionCtrl.addPermission);
router.delete('/:id', auth, permissionCtrl.deletePermission);
router.patch('/:id', auth, permissionCtrl.updatePermission);    
module.exports = router;
