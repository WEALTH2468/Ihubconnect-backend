const mongoose = require("mongoose");
const Counter = require("../counter");
const Comment = require("../comment");
const Task = require("../../modules/iperformance/task/task.model");

const ChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    companyDomain: { type: String, required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Number, default: Date.now },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    action: {
      type: String,
      trim: true,
      default: "",
    },
    code: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Not started", "In progress", "Completed", "In review"],
      default: "Not Started",
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Task,
    },
    dueDate: {
      type: Number,
      default: null,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

ChallengeSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { counterId: "challengeId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `CH-${counter.seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

ChallengeSchema.pre("findOneAndDelete", async function (next) {
  const risk = await this.model.findOne(this.getFilter());
  await Comment.deleteMany({ riskId: risk._id });
  next();
});
module.exports = mongoose.model("Challenge", ChallengeSchema);
