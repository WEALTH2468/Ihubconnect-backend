const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lessonSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number }, // in minutes
    materials: [
        {
            type: { type: String }, // e.g., 'video', 'document'
            link: { type: String },
            title: { type: String },
        },
    ],
    type: { type: String, enum: ['video', 'document', 'text'] },
    url: { type: String },
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Lesson', lessonSchema);
