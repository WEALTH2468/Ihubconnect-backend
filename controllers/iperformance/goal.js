const mongoose = require("mongoose");
const Goal = require("../../models/iperformance/goal");

exports.getGoal = async (req, res, next) => {
  const id = req.params.id;

  try {
    const goal = await Goal.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }
    return res.status(200).json(goal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.addGoal = async (req, res, next) => {
  try {
    const goal = new Goal({
      userId: req.auth.userId,
      companyDomain: req.auth.companyDomain,
      ...req.body,
    });

    await goal.save();
    return res.status(201).json({ goal });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGoal = async (req, res, next) => {
  const id = req.params.id;
  const goalData = req.body;

  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, companyDomain: req.auth.companyDomain },
      goalData,
      {
        new: true,
      }
    );
    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const updatedGoalWithObjectives = await Goal.aggregate([
      {
        $match: { _id: updatedGoal._id, companyDomain: req.auth.companyDomain },
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
    return res.status(200).json({ updatedGoal: updatedGoalWithObjectives[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || req.query.ids;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No goal IDs provided for bulk delete" });
    }

    const result = await Goal.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No goals found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} goals deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getGoals = async (req, res, next) => {
  try {
    const goalsPerFetch = 20;
    const count = Number(req.query.count) || 0;
    const limit = goalsPerFetch;
    const skip = count * goalsPerFetch;
    const searchQuery = req.query.search;
    const startDate = req.query.startDate;
    const due = req.query.due;
    const priority = req.query.priority;
    const endDate = req.query.endDate;
    const userIds = JSON.parse(req.query.users || "[]");
    const teamIds = JSON.parse(req.query.teams || "[]");
    const statuses = JSON.parse(req.query.status || "[]");
    const categoryIds = JSON.parse(req.query.categories || "[]");
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

    if (userIds.length > 0) {
      query.collaborators = {
        $in: userIds,
      };
    }

    if (endDate && endDate !== "NaN") {
      //filter by endDate timestampe
      query.endDate = { $lte: Number(endDate) };
    }

    if (categoryIds.length > 0) {
      query.category = {
        $in: categoryIds,
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

    const goalsWithObjectives = await Goal.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "objectives",
          localField: "_id",
          foreignField: "goalId",
          as: "objectives",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await Goal.countDocuments(query);

    return res.status(200).json({
      goals: goalsWithObjectives,
      meta: {
        totalRowCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.archiveGoal = async (req, res) => {
  try {
    const { goalIds, archived } = req.body;

    // Update the goals and return the updated documents
    const updatedGoals = await Goal.updateMany(
      { _id: { $in: goalIds }, companyDomain: req.auth.companyDomain },
      { archived },
      { new: true }
    );
    return res.status(200).json({
      updatedGoals,
      message: "Goals moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
