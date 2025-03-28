const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: { type: String, required: true },
  companyDomain: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Number, required: true },
});

module.exports = mongoose.model("Category", categorySchema);
