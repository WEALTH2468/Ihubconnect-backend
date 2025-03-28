const mongoose = require("mongoose");
const Risk = require("../../models/iperformance/risk");

exports.getRisk = async (req, res, next) => {
  const id = req.params.id;

  try {
    const risk = await Risk.find({
      _id: id,
      companyDomain: req.auth.companyDomain,
    }).populate("taskId");
    const riskObj = risk[0];

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }
    return res.status(200).json(riskObj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addRisk = async (req, res, next) => {
  const { title, status } = req.body;

  try {
    const risk = new Risk({
      title,
      status,
      reportedBy: req.auth.userId,
      createdBy: req.auth.userId,
      companyDomain: req.auth.companyDomain,
    });

    await risk.save();
    return res.status(201).json({ risk });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateRisk = async (req, res, next) => {
  const id = req.params.id;
  const riskData = req.body;

  try {
    const updatedRisk = await Risk.findOneAndUpdate({_id: id, companyDomain: req.auth.companyDomain}, riskData, {
      new: true,
    });
    if (!updatedRisk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    return res.status(200).json({ updatedRisk });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteRisk = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No risk IDs provided for bulk delete" });
    }

    const result = await Risk.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No goals found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} risks deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getRisks = async (req, res, next) => {
  try {
    const risksPerFetch = 20;
    const count = Number(req.query.count) || 0;
    const limit = risksPerFetch;
    const skip = count * risksPerFetch;
    const searchQuery = req.query.search;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const userIds = JSON.parse(req.query.users || "[]");
    const tasks = JSON.parse(req.query.tasks || "[]");

    let query = { companyDomain: req.auth.companyDomain };

    if (searchQuery && searchQuery.length > 0 && searchQuery !== "undefined") {
      query.$or = [
        { code: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
        { title: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
    }

    if (startDate) {
      // filter by startDate timestamp
      query.startDate = { $gte: Number(startDate) };
    }

    if (endDate) {
      //filter by endDate timestampe
      query.endDate = { $lte: Number(endDate) };
    }

    if (tasks.length > 0) {
      query.taskId = {
        $in: tasks.map((taskId) => {
          const taskObjectId = new mongoose.Types.ObjectId(taskId);
          return taskObjectId;
        }),
      };
    }

    if (userIds.length > 0) {
      query.reportedBy = {
        $in: userIds.map((userId) => {
          const userObjectId = new mongoose.Types.ObjectId(userId);
          return userObjectId;
        }),
      };
    }

    const risks = await Risk.aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await Risk.countDocuments(query);
    return res.status(200).json({
      risks: risks,
      meta: {
        totalRowCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
