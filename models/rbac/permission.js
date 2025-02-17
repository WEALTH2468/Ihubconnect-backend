const mongoose = require('mongoose');

const permissionSchema = mongoose.Schema({
    action: { type: String, required: true },
    subject: { type: String, required: true },
    conditions: { type: String, default: "" },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
});

module.exports = mongoose.model('Permission', permissionSchema);
