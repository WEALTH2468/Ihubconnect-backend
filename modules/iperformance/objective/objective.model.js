const mongoose = require("mongoose");
const Task = require("../task/task.model");
const Schema = mongoose.Schema;
const Counter = require("../../../models/counter");

const ObjectiveSchema = new Schema({
  companyDomain: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "Goal" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
  teams: [],
  createdAt: { type: Number, default: Date.now },
  code: { type: String },
  title: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  progress: { type: Number, default: 0 },
  status: {
    type: String,
    default: "Not started",
    enum: ["Not started", "In progress", "Completed", "In review"],
  },
  startDate: { type: Number },
  endDate: { type: Number },
  priority: { type: String },
  tasks: { type: Array, default: [] },
  comments: { type: Array, default: [] },
  archived: { type: Boolean, default: false },
  type: { type: String, default: "Objective" },
  goalCode: { type: String },
  commentsCount: { type: Number, default: 0 },
});

ObjectiveSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { counterId: "objectiveId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `OB-${counter.seq} `;
    next();
  } catch (err) {
    next(err);
  }
});

ObjectiveSchema.pre("findOneAndDelete", async function (next) {
  const objective = await this.model.findOne(this.getFilter());

  await Task.deleteMany({ objectiveId: objective._id });
  next();
});

const Objectives = mongoose.model("Objective", ObjectiveSchema);

module.exports = Objectives;
