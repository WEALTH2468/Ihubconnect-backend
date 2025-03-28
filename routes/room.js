const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/room');

router.post('/rooms', RoomController.createRoom);
router.get('/rooms/:id', RoomController.getRoom);
router.put('/rooms/:id', RoomController.updateRoom); 

module.exports = router;
