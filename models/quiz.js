const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const quizSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [
        {
            questionText: { type: String, required: true },
            options: [
                {
                    optionText: { type: String, required: true },
                    isCorrect: { type: Boolean, required: true },
                },
            ],
            explanation: { type: String },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quiz', quizSchema);
