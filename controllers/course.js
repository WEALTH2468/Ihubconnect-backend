const Course = require('../models/course');

exports.getCourses = async (req, res, next) => {
    try {
        const course = await Course.aggregate([
            {
                $lookup: {
                    from: 'lesson',
                    localField: '_id',
                    foreignField: 'lessonId',
                    as: 'lessons',
                },
            },
        ]);
        return res.status(200).json(course);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.getCourse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const course = await Course.findOne({
            _id: id,
        });
        return res.status(200).json(course);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};

exports.addCourse = async (req, res, next) => {
    try {
        const {
            name,
            description,
            imageUrl,
            units,
            objectives,
            participants,
            lessonId,
        } = req.body;

        const course = new Course({
            name,
            description,
            imageUrl,
            units,
            objectives,
            participants,
            lessonId,
        });
        await course.save();
        return res.status(200).json({
            message: 'Course Added Successfully',
            course,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updateCourse = async (req, res, next) => {
    const { id } = req.params;
    const courseData = req.body;

    try {
        const updatedCourse = await Course.findByIdAndUpdate(id, courseData, {
            new: true,
        });

        if (!updatedCourse) {
            return res.status(404).json({
                error: 'Course Not Found',
            });
        }
        return res.status(200).json({
            message: 'Course Updated Sucessfully',
            updatedCourse,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
exports.deleteCourse = async (req, res, next) => {
    const { id } = req.params;

    try {
        const deletedCourse = await Course.findOneAndDelete({
            _id: id,
        });

        if (!deletedCourse) {
            return res.status(404).json({
                error: 'Course Not Found',
            });
        }
        return res.status(200).json({
            message: 'Course Deleted Successfully',
            deletedCourse,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: error.message,
        });
    }
};
