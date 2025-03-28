const Lesson = require('../models/lesson');

exports.getLessons = async (req, res, next) => {
    try {
        const lesson = await Lesson.find({});
        return res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.getLesson = async (req, res, next) => {
    const { id } = req.params;

    try {
        const lesson = await Lesson.findOne({
            _id: id,
        });
        return res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.addLesson = async (req, res, next) => {
    try {
        const {
            name,
            description,
            duration,
            materials,
            type,
            url,
            text,
            createdAt,
            updatedAt,
        } = req.body;

        const lesson = new Lesson({
            name,
            description,
            duration,
            materials,
            type,
            url,
            text,
            createdAt,
            updatedAt,
        });
        await lesson.save();
        return res.status(200).json({
            message: 'Lesson Added Successfully',
            lesson,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updateLesson = async (req, res, next) => {
    const { id } = req.params;
    const lessonData = req.body;

    try {
        const updatedLesson = await Lesson.findByIdAndUpdate(id, lessonData, {
            new: true,
        });

        if (!updatedLesson) {
            return res.status(404).json({
                error: 'Lesson Not Found',
            });
        }
        return res.status(200).json({
            message: 'Lesson Updated Sucessfully',
            updatedLesson,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
exports.deleteLesson = async (req, res, next) => {
    const { id } = req.params;

    try {
        const deletedLesson = await Lesson.findOneAndDelete({
            _id: id,
        });

        if (!deletedLesson) {
            return res.status(404).json({
                error: 'Lesson Not Found',
            });
        }
        return res.status(200).json({
            message: 'Lesson Deleted Successfully',
            deletedLesson,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
