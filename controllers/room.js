const Room = require('../models/room');

const RoomController = {
  // Create a new room
  async createRoom(req, res) {
    try {
      const { name, isGroup, members } = req.body;
      const newRoom = new Room({ name, isGroup, members });
      await newRoom.save();
      res.status(201).json(newRoom);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get room details
  async getRoom(req, res) {
    try {
      const roomId = req.params.id;
      const room = await Room.findById(roomId);
      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update room details
  async updateRoom(req, res) {
    try {
      const roomId = req.params.id;
      const { name, members } = req.body;

      const updatedRoom = await Room.findByIdAndUpdate(
        roomId,
        { name, members },
        { new: true }
      );

      if (!updatedRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.status(200).json(updatedRoom);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = RoomController;
