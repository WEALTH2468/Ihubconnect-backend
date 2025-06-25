const GoalRepository = require("./goal.repository");
const GoalService = require("./goal.service");
const goalService = new GoalService(new GoalRepository());

exports.getGoals = async (req, res) => {
  try {
    const filters = {
      count: Number(req.query.count) || 0,
      searchQuery: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      due: req.query.due,
      priority: req.query.priority,
      categoryIds: JSON.parse(req.query.categories || "[]"),
      userIds: JSON.parse(req.query.users || "[]"),
      statuses: JSON.parse(req.query.status || "[]"),
      teamIds: JSON.parse(req.query.teams || "[]"),
      view: req.query.view,
    };

    const arrayFilters = ["categoryIds", "userIds", "statuses", "teamIds"];

    for (const key of arrayFilters) {
      if (!Array.isArray(filters[key])) {
        return res
          .status(400)
          .json({ message: `${key} filters must be an array` });
      }
    }
    const goals = await goalService.getGoals(filters);
    return res.status(200).json(goals);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
};

exports.getGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const goal = await goalService.getGoalById(goalId);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ goal });
  } catch (error) {
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { title, status } = req.body;
    const data = {
      title,
      status,
      ...req.body,
    };

    const goal = await goalService.createGoal(data);
    return res.status(201).json({ message: "Goal created successfully", goal });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const goalId = req.params.id;
    const data = req.body;
    const goal = await goalService.updateGoal(goalId, data);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ updatedGoal: goal });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No goal IDs provided for bulk delete" });
    }

    const result = await goalService.deleteGoal(selectedIds);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No goals found for the provided IDs" });
    }

    return res.status(200).json({
      message: "Goals deleted successfully",
      ids: result.ids,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    if (error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.archiveGoal = async (req, res) => {
  try {
    const { goalIds, archived } = req.body;
    const updatedGoals = await goalService.archiveGoals(goalIds, archived);

    return res.status(200).json({
      updatedGoals,
      message: "Goals moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
