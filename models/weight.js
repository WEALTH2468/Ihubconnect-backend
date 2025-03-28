const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const weightSchema = new Schema(
  {
    value: { type: Number, default: 1 },
    companyDomain: { type: String },
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    createdAt: { type: Number },
    updatedAt: { type: Number },
    icon: { type: String },
  },
  { timestamps: true }
);

const Weight = mongoose.model("Weight", weightSchema);
module.exports = Weight;
