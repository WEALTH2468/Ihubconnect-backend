const mongoose = require("mongoose");
const Weight = require("./weight"); // Import Weight model

const jobPositionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyDomain: { type: String, required: true },
  level: {
    type: String,
    enum: ["Junior", "Mid", "Senior", "Lead", "Executive"],
  },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPosition",
    default: null,
  },
  weights: [{ type: mongoose.Schema.Types.ObjectId, ref: "Weight" }],
  isActive: { type: Boolean, required: true },
});

// // **Pre-save hook to check or create "Task" & "Report" weights with icons**
// jobPositionSchema.pre("save", async function (next) {
//   try {
//     const requiredWeights = [
//       { name: "Task", icon: "#007BFF" },
//       { name: "Report", icon: "#6C757D" },
//     ];

//     const existingWeights = await Weight.find({
//       name: { $in: requiredWeights.map((w) => w.name) },
//     });
//     const weightMap = new Map(
//       existingWeights.map((weight) => [weight.name, weight._id])
//     );

//     for (const { name, icon } of requiredWeights) {
//       if (!weightMap.has(name)) {
//         const newWeight = await Weight.create({
//           name,
//           value: 1,
//           icon,
//           createdAt: Date.now(),
//           updatedAt: Date.now(),
//         });
//         weightMap.set(name, newWeight._id);
//       }
//     }

//     this.weights = [...new Set([...this.weights, ...weightMap.values()])];

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

const JobPosition = mongoose.model("JobPosition", jobPositionSchema);
module.exports = JobPosition;
