const mongoose = require('mongoose');

const roleSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    permissions: {type: String, default: "[]"},
});

module.exports = mongoose.model('Role', roleSchema);
