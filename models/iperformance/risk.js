const mongoose = require("mongoose");
const Comment = require("../comment");
const Counter = require("../counter");
const Task = require("../../modules/iperformance/task/task.model");

const Schema = mongoose.Schema;

const riskSchema = new Schema({
  title: { type: String },
  criticality: { type: String },
  companyDomain: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String },
  description: { type: String },
  code: { type: String },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Task,
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
    this.code = `RK-${counter.seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

riskSchema.pre("findOneAndDelete", async function (next) {
  const risk = await this.model.findOne(this.getFilter());
  await Comment.deleteMany({
    riskId: risk._id,
    companyDomain: this.companyDomain,
  });
  next();
});

const Risk = mongoose.model("Risk", riskSchema);

module.exports = Risk;
