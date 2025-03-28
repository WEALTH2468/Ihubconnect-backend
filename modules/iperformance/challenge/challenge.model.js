const mongoose = require("mongoose");
const Counter = require("../../../models/counter");
const Comment = require("../../../models/comment");
const Task = require("../task/task.model");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
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
      default: "Not started",
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

challengeSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { counterId: "challengeId", companyDomain: this.companyDomain },
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

module.exports = mongoose.model("Challenge2", challengeSchema);
