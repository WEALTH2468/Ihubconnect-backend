// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const Counter = require("../counter");

// const goalSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: "User" },
//   code: { type: String },
//   companyDomain: { type: String, required: true },
//   createdAt: { type: Number, default: Date.now },
//   category: { type: String },
//   collaborators: [],
//   teams: [],
//   title: { type: String },
//   description: { type: String },
//   objectives: [{ type: Schema.Types.ObjectId, ref: "Objective" }],
//   progress: { type: Number },
//   status: { type: String },
//   comments: { type: Array, default: [] },
//   startDate: { type: Number },
//   endDate: { type: Number },
//   priority: { type: String },
//   archived: { type: Boolean, default: false },
//   commentsCount: { type: Number, default: 0 },
// });

// goalSchema.pre("validate", async function (next) {
//   try {
//     const counter = await Counter.findOneAndUpdate(
//       { counterId: "goalsId", companyDomain: this.companyDomain },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true }
//     );
//     this.code = `GL-${counter.seq}`;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// const Goal = mongoose.model("Goal", goalSchema);
// module.exports = Goal;
