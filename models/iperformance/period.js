const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Counter = require("../counter");

const periodSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  code: { type: String },
  companyDomain: { type: String, required: true },
  name: { type: String },
  description: { type: String, default: "" },
  createdAt: { type: Number },
  updatedAt: { type: Number },
  status: { type: String, default: "Not started" },
  dateRange: { type: String, default: "" },
  startDate: { type: Number },
  endDate: { type: Number },
  daysLeft: { type: Number },
});

periodSchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findOneAndUpdate(
      { counterId: "periodsId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `PR-${counter.seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

const Weight = mongoose.model("Period", periodSchema);
module.exports = Weight;
