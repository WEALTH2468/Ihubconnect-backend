const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
    name: { type: String },
    email: { type: String },
    description: { type: String },
    category: { type: String },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
