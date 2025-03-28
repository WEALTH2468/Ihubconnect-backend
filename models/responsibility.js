const mongoose = require('mongoose');

const responsibilitySchema = mongoose.Schema({
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    title: { type: String },
    weight: { type: String },
    value: { type: Number },
    description: { type: String },

});

module.exports = mongoose.model('Responsibility', responsibilitySchema);
