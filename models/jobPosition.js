const mongoose = require("mongoose");
const Weight = require("./weight"); // Import Weight model

const jobPositionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyDomain: { type: String, required: true },
  level: {
    type: String,
    enum: ["Junior", "Mid", "Senior", "Lead", "Executive"],
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPosition",
    default: null,
  },
  weights: [{ type: mongoose.Schema.Types.ObjectId, ref: "Weight" }],
  isActive: { type: Boolean, required: true },
});



const JobPosition = mongoose.model("JobPosition", jobPositionSchema);
module.exports = JobPosition;
