const express = require("express");
const auth = require("../middlewares/auth");
const router = express.Router();
const multer = require('../middlewares/multer-config');
const teamCtrl = require('../controllers/team');



router.get('/users',auth, teamCtrl.getUsers);
router.get('/',auth, teamCtrl.getTeams);
router.get('/:id',auth, teamCtrl.getTeam);
router.post('/',auth, multer, teamCtrl.addTeam);
router.delete('/:ids', auth, teamCtrl.deleteTeam);
router.patch('/:id', auth, multer, teamCtrl.updateTeam);


module.exports = router;