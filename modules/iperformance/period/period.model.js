const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../../../models/counter");

const periodSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  code: { type: String },
  name: { type: String, unique: true, required: true },
  description: { type: String, default: "" },
  createdAt: { type: Number },
  updatedAt: { type: Number },
  status: {
    type: String,
    default: "Not started",
    enum: ["Not started", "In progress", "Completed", "In review"],
  },
  dateRange: { type: String, default: "" },
  startDate: { type: Number },
  endDate: { type: Number },
  daysLeft: { type: Number },
});

periodSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "periodsId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `PR-${counter.seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

const Weight = mongoose.model("Period2", periodSchema);
module.exports = Weight;
