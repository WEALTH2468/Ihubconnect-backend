const mongoose = require("mongoose");
const Comment = require("../../../models/comment");
const Counter = require("../../../models/counter");
const Task = require("../task/task.model");

const Schema = mongoose.Schema;

const riskSchema = new Schema({
  title: { type: String, required: true, unique: true },
  criticality: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Not started", "In progress", "Completed"] },
  description: { type: String },
  code: { type: String },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
  mitigation: {
    type: String,
    trim: true,
    default: "",
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
});

riskSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { counterId: "riskId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!this.code) {
      this.code = `TS-${counter.seq}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Risk = mongoose.model("Risk2", riskSchema);

module.exports = Risk;
