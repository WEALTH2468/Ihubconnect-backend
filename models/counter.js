const mongoose = require("mongoose");

const { Schema } = mongoose;

const counterSchema = new Schema({
  counterId: { type: String, required: true },
  companyDomain: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model("Counter", counterSchema);
