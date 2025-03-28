const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendantSchema = new Schema({
  companyDomain:{type: String},
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  isCheckedIn: { type: Boolean, default: false },
  isCheckedOut: { type: Boolean, default: false },
  checkIn: { type: Date },
  checkInImagePath: { type: String, required: true },
  checkInNote: { type: String },
  checkOut: { type: Date },
  checkOutImagePath: { type: String },
  checkOutNote: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending', // Pending until the admin approves or rejects
  },
});
const Attendant = mongoose.model('attendant', attendantSchema);

module.exports = Attendant;
