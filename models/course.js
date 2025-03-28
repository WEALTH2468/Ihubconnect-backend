const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    units: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
    objectives: { type: Array, default: [] },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lessonIds: { type: Array, default: [] },
});

module.exports = mongoose.model('Course', courseSchema);
