const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Department model
const departmentSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    units: { type: [String], default: [] }, // This defines 'units' as an array of strings
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
