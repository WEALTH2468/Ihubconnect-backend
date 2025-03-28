const Objective = require("../../models/iperformance/objective");
const Goal = require("../../models/iperformance/goal");
const mongoose = require("mongoose");
const {
  calculateParentStatusAndProgress,
} = require("../../lib/iperformance/controller-utils");

exports.getObjective = async (req, res, next) => {
  const id = req.params.id;

  try {
    const objective = await Objective.find({
      _id: id,
      companyDomain: req.auth.companyDomain,
    }).populate("goalId");
    const objectiveObj = objective[0];

    if (!objective) {
      return res.status(404).json({ message: "Objective not found" });
    }
    return res.status(200).json(objectiveObj);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getObjectives = async (req, res) => {
  const objectivesPerFetch = 20;
  const count = Number(req.query.count) || 0;
  const limit = objectivesPerFetch;
  const skip = count * objectivesPerFetch;
  const searchQuery = req.query.search;
  const startDate = req.query.startDate;
  const due = req.query.due;
  const priority = req.query.priority;
  const endDate = req.query.endDate;
  const goals = JSON.parse(req.query.goals || "[]");
  const userIds = JSON.parse(req.query.users || "[]");
  const statuses = JSON.parse(req.query.status || "[]");
  const teamIds = JSON.parse(req.query.teams || "[]");
  const view = req.query.view;

  let query = { companyDomain: req.auth.companyDomain };

  if (searchQuery && searchQuery.length > 0 && searchQuery !== "undefined") {
    query.$or = [
      { code: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
      { title: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
    ];
  }

  if (startDate && startDate !== "NaN") {
    // filter by startDate timestamp
    query.startDate = { $gte: Number(startDate) };
  }

  if (endDate && endDate !== "NaN") {
    //filter by endDate timestamp
    query.endDate = { $lte: Number(endDate) };
  }

  if (goals.length > 0) {
    query.goalId = {
      $in: goals.map((goalId) => {
        const goalObjectId = new mongoose.Types.ObjectId(goalId);
        return goalObjectId;
      }),
    };
  }

  if (userIds.length > 0) {
    query.collaborators = {
      $in: userIds,
    };
  }

  if (teamIds.length > 0) {
    query.teams = {
      $in: teamIds,
    };
  }

  if (statuses.length > 0) {
    const statusFilter = [];
    if (statuses[0]) statusFilter.push("Completed");
    if (statuses[1]) statusFilter.push("In review");
    if (statuses[2]) statusFilter.push("In progress");
    if (statuses[3]) statusFilter.push("Not started");

    if (statusFilter.length > 0) {
      query.status = { $in: statusFilter };
    }
  }

  if (due) {
    if (due === "Due today") {
      const startOfDay = new Date().setHours(0, 0, 0, 0);
      const endOfDay = new Date().setHours(23, 59, 59, 999);
      query.endDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (due === "Due this week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      query.endDate = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (due === "Due this month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0
      );
      endOfMonth.setHours(23, 59, 59, 999);

      query.endDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
  }

  if (priority) {
    query.priority = { $regex: priority, $options: "i" };
  }

  if (view) {
    query.archived = view === "archived" ? true : false;
  }

  try {
    const objectivesWithTasks = await Objective.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "task2",
          let: { objectiveId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$objectiveId", "$$objectiveId"] },
                    { $eq: ["$isSubtask", false] },
                  ],
                },
              },
            },
          ],
          as: "tasks",
        },
      },
      {
        $lookup: {
          from: "goals",
          localField: "goalId",
          foreignField: "_id",
          as: "goal",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalRowCount = await Objective.countDocuments(query);

    res.json({ objectives: objectivesWithTasks, meta: { totalRowCount } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addObjective = async (req, res) => {
  const { title, status } = new Objective(req.body);
  try {
    const objective = new Objective({
      userId: req.auth.userId,
      companyDomain: req.auth.companyDomain,
      title,
      status,
    });
    await objective.save();
    res.status(201).json({ objective });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateObjective = async (req, res) => {
  try {
    const updatedObjective = await Objective.findOneAndUpdate(
      { _id: req.params.id, companyDomain: req.auth.companyDomain },
      req.body,
      { new: true }
    );
    if (!updatedObjective)
      return res.status(404).json({ message: "Objective not found" });

    // if the updated objective has a goalId
    if (updatedObjective.goalId) {
      const goal = await Goal.aggregate([
        {
          $match: {
            _id: updatedObjective.goalId,
            companyDomain: req.auth.companyDomain,
          },
        },
        {
          $lookup: {
            from: "objectives",
            localField: "_id",
            foreignField: "goalId",
            as: "objectives",
          },
        },
      ]);

      const goalsObjectives = goal[0].objectives;
      const goalStatuses = {
        completed: "Completed",
        inProgress: "In progress",
        inReview: "In review",
        notStarted: "Not started",
      };

      const { parentStatus, progress } = calculateParentStatusAndProgress(
        goalsObjectives,
        goalStatuses
      );

      // Update the goal if needed
      if (goal[0].status !== parentStatus || goal[0].progress !== progress) {
        await Goal.findOneAndUpdate(
          {
            _id: updatedObjective.goalId,
            companyDomain: req.auth.companyDomain,
          },
          {
            status: parentStatus,
            progress: progress,
          },
          { new: true }
        );
      }
    }

    return res.json({ objective: updatedObjective });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteObjective = async (req, res) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No objective IDs provided for bulk delete" });
    }

    const result = await Objective.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No objectives found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} objectives deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.archiveObjective = async (req, res) => {
  try {
    const { objectiveIds, archived } = req.body;

    // Update the objective and return the updated documents
    const updatedObjectives = await Objective.updateMany(
      { _id: { $in: objectiveIds }, companyDomain: req.auth.companyDomain },
      { archived },
      { new: true }
    );
    return res.status(200).json({
      updatedObjectives,
      message: "Objectives moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
