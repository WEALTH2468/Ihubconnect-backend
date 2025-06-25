const Permission = require('../../models/rbac/permission');

exports.getPermissions = async (req, res) => {
    try {
        const permissions = await Permissions.find();
        return res.status(200).json(permissions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.getPermissionsForRole = async (req, res) => {
    const { id } = req.params;

    try {
        const permissions = await Permission.find({ roleId: id });
        return res.status(200).json(permissions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.addPermission = async (req, res) => {
    try {
        const { name, description } = req.body;

        const permission = new Permission({
            name,
            description,
        });

        await permission.save();
        return res.status(200).json({
            message: 'Permission added successfully!',
            permission,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

exports.updatePermission = async (req, res) => {
    const { id } = req.params;
    const permissionData = req.body;

    Permission.findByIdAndUpdate(id, permissionData, { new: true })
        .then((updatedPermission) => {
            if (updatedPermission) {
                return res.status(200).json({
                    updatedPermission,
                    message: 'Permission updated successfully!',
                });
            } else {
                return res.status(404).json({
                    message: 'Permission not found!',
                });
            }
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({ message: error.message });
        });
};

exports.deletePermission = async (req, res, next) => {
    const { id } = req.params;

    try {
        const deletedPermission = await Permission.findOneAndDelete({ _id: id });
        if (!deletedPermission) {
            return res.status(404).json({ error: 'Permission not found' });
        }
        return res.status(200).json({ message: 'Permission deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
