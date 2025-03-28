const express = require('express');
const auth = require('../middlewares/auth');
const router = express.Router();
const jobPositionCtrl = require('../controllers/jobPosition');

router.patch("/set-all-duplicates", jobPositionCtrl.resolveAllDuplicates)

router.get('/', auth, jobPositionCtrl.getJobPositions);
router.get('/:id', auth, jobPositionCtrl.getJobPosition);
router.post('/', auth, jobPositionCtrl.addJobPosition);
router.post('/weights', auth, jobPositionCtrl.addWeight);
router.delete('/:id/weights/:weightId', auth, jobPositionCtrl.deleteWeight);
router.delete('/:id', auth, jobPositionCtrl.deleteJobPosition);
router.patch('/:id', auth, jobPositionCtrl.updateJobPosition);



module.exports = router;
