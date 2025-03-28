const mongoose = require("mongoose");
const Counter = require("../counter");

const categorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  companyDomain: { type: String, required: true },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    default: null,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

categorySchema.pre("validate", async function (next) {
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "categoryId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.code = `CA-${counter.seq}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("IperformanceCategory", categorySchema);
