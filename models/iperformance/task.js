// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const Counter = require("../counter");

// const taskSchema = new Schema({
//   userId: { type: Schema.Types.ObjectId, ref: "User" },
//   code: { type: String },
//   title: { type: String, required: true },
//   task: { type: String },
//   owner: [{ type: Schema.Types.ObjectId, ref: "User" }],
//   description: { type: String },
//   createdAt: { type: Number },
//   status: { type: String },
//   priority: { type: String },
//   weight: { type: Schema.Types.ObjectId, ref: "Weight" },
//   startDate: { type: Number },
//   endDate: { type: Number },
//   dependentOn: { type: String },
//   duration: { type: String },
//   progress: { type: Number },
//   plannedEffort: { type: Number },
//   effortSpent: { type: Number },
//   budget: { type: Number },
//   goalId: { type: Schema.Types.ObjectId, ref: "Goal" },
//   period: { type: Schema.Types.ObjectId, ref: "Period" },
//   objectiveId: { type: Schema.Types.ObjectId, ref: "Objective" },
//   archived: { type: Boolean, default: false },
//   commentsCount: { type: Number, default: 0 },
//   isSubtask: { type: Boolean, default: false },
//   subtasks: [{ type: Schema.Types.ObjectId, ref: "Task2" }],
// });

// taskSchema.pre("validate", async function (next) {
//   try {
//     const counter = await Counter.findByIdAndUpdate(
//       { _id: "tasksId", companyDomain: this.companyDomain },
//       { $inc: { seq: 1 } },
//       { new: true, upsert: true }
//     );

//     if (!this.code) {
//       this.code = `TS-${counter.seq}`;
//     }

//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// const Task = mongoose.model("Task2", taskSchema);
// module.exports = Task;
