const mongoose = require("mongoose");
const Challenge = require("../../models/iperformance/challenge");

exports.getChallenge = async (req, res, next) => {
  const id = req.params.id;

  try {
    const challenge = await Challenge.find({
      _id: id,
      companyDomain: req.auth.companyDomain,
    }).populate("taskId");
    const challengeObj = challenge[0];

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    return res.status(200).json(challengeObj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addChallenge = async (req, res, next) => {
  const { title, status } = req.body;

  try {
    const challenge = new Challenge({
      title,
      status,
      reportedBy: req.auth.userId,
      createdBy: req.auth.userId,
      companyDomain: req.auth.companyDomain,
    });

    await challenge.save();
    return res.status(201).json({ challenge });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateChallenge = async (req, res, next) => {
  const id = req.params.id;
  const challengeData = req.body;

  try {
    const updatedChallenge = await Challenge.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      challengeData,
      {
        new: true,
      }
    );
    if (!updatedChallenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    return res.status(200).json({ updatedChallenge });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteChallenge = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No challenge IDs provided for bulk delete" });
    }

    const result = await Challenge.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No goals found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} challenges deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getChallenges = async (req, res, next) => {
  try {
    const challengesPerFetch = 20;
    const count = Number(req.query.count) || 0;
    const limit = challengesPerFetch;
    const skip = count * challengesPerFetch;
    const searchQuery = req.query.search;
    const dueDate = req.query.endDate;
    const userIds = JSON.parse(req.query.users || "[]");
    const tasks = JSON.parse(req.query.tasks || "[]");

    let query = { companyDomain: req.auth.companyDomain };

    if (searchQuery && searchQuery.length > 0 && searchQuery !== "undefined") {
      query.$or = [
        { code: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
        { title: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
    }

    if (dueDate) {
      //filter by endDate timestampe
      query.dueDate = { $lte: Number(dueDate) };
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

    const challenges = await Challenge.aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await Challenge.countDocuments(query);
    return res.status(200).json({
      challenges: challenges,
      meta: {
        totalRowCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
