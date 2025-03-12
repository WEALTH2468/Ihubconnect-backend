const mongoose = require("mongoose");

const { Schema } = mongoose;

const itemSchema = new Schema({
  name: { type: String, required: true },
  companyDomain: { type: String, required: true },
  description: { type: String },
  type: { type: String, default: "Goods" },
  price: { type: Number, required: true },
});

module.exports = mongoose.model("Item", itemSchema);
