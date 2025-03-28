const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Unit model
const unitSchema = new Schema({
    name: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
});

const Unit = mongoose.model('Unit', unitSchema);

module.exports = Unit;
