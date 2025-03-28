const Quiz = require('../models/quiz');

exports.getQuizs = async (req, res, next) => {
    try {
        const quiz = await Quiz.find({});
        return res.status(200).json(quiz);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.getQuiz = async (req, res, next) => {
    const { id } = req.params;

    try {
        const quiz = await Quiz.findOne({
            _id: id,
        });
        return res.status(200).json(quiz);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.addQuiz = async (req, res, next) => {
    try {
        const { title, description, questions, createdAt, updatedAt } =
            req.body;

        const quiz = new Quiz({
            title,
            description,
            questions,
            createdAt,
            updatedAt,
        });
        await quiz.save();
        return res.status(200).json({
            message: 'Quiz Added Successfully',
            quiz,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updateQuiz = async (req, res, next) => {
    const { id } = req.params;
    const quizData = req.body;

    try {
        const updatedQuiz = await Quiz.findByIdAndUpdate(id, quizData, {
            new: true,
        });

        if (!updatedQuiz) {
            return res.status(404).json({
                error: 'Quiz Not Found',
            });
        }
        return res.status(200).json({
            message: 'Quiz Updated Sucessfully',
            updatedQuiz,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
exports.deleteQuiz = async (req, res, next) => {
    const { id } = req.params;

    try {
        const deletedQuiz = await Quiz.findOneAndDelete({
            _id: id,
        });

        if (!deletedQuiz) {
            return res.status(404).json({
                error: 'Quiz Not Found',
            });
        }
        return res.status(200).json({
            message: 'Quiz Deleted Successfully',
            deletedQuiz,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
