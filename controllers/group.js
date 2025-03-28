const Group = require('../models/group');

exports.getGroups = async (req, res, next) => {
    try {
        const groupsWithTasks = await Group.aggregate([
            {
                $lookup: {
                    from: 'tasks', // The name of the tasks collection
                    localField: '_id',
                    foreignField: 'groupId',
                    as: 'tasks',
                },
            },
        ]);

        return res.status(200).json(groupsWithTasks);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.addGroup = async (req, res, next) => {
    try {
        const { createdBy, title, description, members } = req.body;

        const data = {
            createdBy,
            title,
            description,
            members,
        };
        const newGroup = new Group(data);

        const group = await newGroup.save();

        res.status(200).json(group);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.deleteGroup = async (req, res, next) => {
    const groupId = req.params.id;
    try {
        const deletedGroup = await Group.findOneAndDelete({ _id: groupId });
        if (!deletedGroup) {
            return res.status(404).json({ error: 'Group not found' });
        }
        return res.status(200).json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updateGroup = async (req, res, next) => {
    const groupId = req.params.id;

    const groupData = req.body;

    Group.findByIdAndUpdate(
        groupId, // find the user by id
        groupData, // updated data
        { new: true }
    )
        .then((updatedGroup) => {
            if (updatedGroup) {
                return res.status(200).json({
                    updatedGroup,
                    message: 'Updated successfully!',
                });
            } else {
                return res.status(404).json({
                    message: 'Group not found!',
                });
            }
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({ message: error.message });
        });
};
