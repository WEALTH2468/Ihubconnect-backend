const Department = require('../models/department');

exports.getDepartments = async (req, res, next) => {
    try {
        const departmentsWihUnit = await Department.aggregate([
            {
                $lookup: {
                    from: 'units', // The name of the units collection
                    localField: '_id',
                    foreignField: 'departmentId',
                    as: 'units',
                },
            },
        ]);
        return res.status(200).json(departmentsWihUnit);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.addDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const department = new Department({
            name,
            description,
        });

        await department.save();
        return res.status(200).json({
            message: 'Department added successfully!',
            department,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updateDepartment = async (req, res, next) => {
    const { id } = req.params;
    const departmentData = req.body;

    Department.findByIdAndUpdate(id, departmentData, { new: true })
        .then((updatedDepartment) => {
            if (updatedDepartment) {
                return res.status(200).json({
                    updatedDepartment,
                    message: 'Department5 updated successfully!',
                });
            } else {
                return res.status(404).json({
                    message: 'Department not found!',
                });
            }
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({ message: error.message });
        });
};

exports.deleteDepartment = async (req, res, next) => {
    const { id } = req.params;

    try {
        const deletedDepartment = await Department.findOneAndDelete({
            _id: id,
        });
        if (!deletedDepartment) {
            return res.status(404).json({ error: 'Department not found' });
        }
        return res
            .status(200)
            .json({ message: 'Department deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
