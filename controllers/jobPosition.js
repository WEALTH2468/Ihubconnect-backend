const JobPosition = require("../models/jobPosition");
const Weight = require("../models/weight");
const Task = require("../modules/iperformance/task/task.model");

exports.getJobPositions = async (req, res) => {
  try {
    const jobPositions = await JobPosition.find({
      companyDomain: req.auth.companyDomain,
    }).populate([{ path: "reportsTo" }, { path: "team" }, { path: "weights" }]);
    return res.status(200).json(jobPositions);
  } catch (error) {
    return res.status(200).json({ message: "Internal server error", error });
  }
};

exports.getJobPosition = async (req, res) => {
  try {
    const id = req.params.id;
    const jobPosition = await JobPosition.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    }).populate([{ path: "reportsTo" }, { path: "team" }, { path: "weights" }]);

    if (!jobPosition) {
      return res.status(404).json({ message: "Job position not found" });
    }
    return res.status(200).json(jobPosition);
  } catch (error) {
    return res.status(200).json({ message: "Internal server error", error });
  }
};

exports.addJobPosition = async (req, res) => {
  try {
    const newJobPosition = new JobPosition({
      ...req.body,
      companyDomain: req.auth.companyDomain,
      isActive: true,
    });

    await newJobPosition.save();

    return res
      .status(200)
      .json({ message: "Job position saved successfully!!!", newJobPosition });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ message: "Internal server error", error });
  }
};

exports.addWeight = async (req, res) => {
  try {
    const { id, weightId } = req.body;

    if (!id || !weightId) {
      return res
        .status(400)
        .json({ message: "Job Position ID and Weight ID are required" });
    }

    const jobPosition = await JobPosition.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });

    if (!jobPosition) {
      return res.status(404).json({ message: "Job Position not found" });
    }

    // check if weight is already in jobPosition
    if (jobPosition.weights.includes(weightId)) {
      return res
        .status(400)
        .json({ message: "Weight already exists in this job position" });
    }

    const updatedJobPosition = await JobPosition.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      { $push: { weights: weightId } },
      { new: true }
    );

    return res.status(200).json({
      message: "Weight added successfully to job position",
      updatedJobPosition,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteWeight = async (req, res) => {
  try {
    const { id, weightId } = req.params;

    if (!id || !weightId) {
      return res
        .status(400)
        .json({ message: "Job Position ID and Weight ID are required" });
    }

    const jobPosition = await JobPosition.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      { $pull: { weights: weightId } },
      { new: true }
    );

    if (!jobPosition) {
      return res.status(404).json({ message: "Job position not found" });
    }

    return res
      .status(200)
      .json({ message: "Weight deleted successfully", jobPosition });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteJobPosition = async (req, res) => {
  try {
    const id = req.params.id;

    const deletedJobPosition = await JobPosition.findOneAndDelete({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });

    if (!deletedJobPosition) {
      return res.status(404).json({ message: "Job position not found" });
    }

    return res.status(200).json({
      message: "Job position deleted successfully!!!",
      deletedJobPosition,
    });
  } catch (error) {
    return res.status(200).json({ message: "Internal server error", error });
  }
};

exports.updateJobPosition = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedJobPosition = await JobPosition.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      req.body,
      { new: true }
    );

    if (!updatedJobPosition) {
      return res.status(404).json({ message: "Job position not found" });
    }

    return res.status(200).json({
      message: "Job position updated successfully!!!",
      updatedJobPosition,
    });
  } catch (error) {
    return res.status(200).json({ message: "Internal server error", error });
  }
};

exports.resolveAllDuplicates = async (req, res) => {
  try {
    const duplicates = await Weight.aggregate([
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
          docs: { $push: "$_id" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    for (const item of duplicates) {
      const [keepId, ...removeIds] = item.docs;

      await Task.updateMany(
        { weight: { $in: removeIds } },
        { $set: { weight: keepId } }
      );

      await Weight.deleteMany({ _id: { $in: removeIds } });
    }

    return res.status(200).json({ duplicates });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occured!" });
  }
};
