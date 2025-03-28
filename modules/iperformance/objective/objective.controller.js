const mongoose = require("mongoose");
const ObjectiveRepository = require("./objective.repository");
const TaskRepository = require("../task/task.repository");
const ObjectiveService = require("./objective.service");
const TaskService = require("../task/task.service");

const objectiveService = new ObjectiveService(new ObjectiveRepository());
const taskService = new TaskService(new TaskRepository());

exports.getObjectives = async (req, res) => {
  try {
    const filters = {
      count: Number(req.query.count) || 0,
      searchQuery: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      due: req.query.due,
      priority: req.query.priority,
      goals: JSON.parse(req.query.goals || "[]"),
      userIds: JSON.parse(req.query.users || "[]"),
      statuses: JSON.parse(req.query.status || "[]"),
      teamIds: JSON.parse(req.query.teams || "[]"),
      view: req.query.view,
    };

    const arrayFilters = ["goals", "userIds", "statuses", "teamIds"];

    for (const key of arrayFilters) {
      if (!Array.isArray(filters[key])) {
        return res
          .status(400)
          .json({ message: `${key} filters must be an array` });
      }
    }
    const objectives = await objectiveService.getObjectives(filters);
    return res.status(200).json(objectives);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
};

exports.getObjective = async (req, res) => {
  try {
    const objectiveId = req.params.id;
    const objective = await objectiveService.getObjectiveById(objectiveId);

    if (!objective) {
      return res.status(404).json({ message: "Objective not found" });
    }

    return res.status(200).json({ objective });
  } catch (error) {
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: "Cast to ObjectId failed" });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.createObjective = async (req, res) => {
  try {
    const { title, status } = req.body;
    const data = {
      title,
      status,
      ...req.body,
    };

    const objective = await objectiveService.createObjective(data);
    return res
      .status(201)
      .json({ message: "Objective created successfully", objective });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Objective already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updateObjective = async (req, res) => {
  try {
    const objectiveId = req.params.id;
    const data = req.body;
    const objective = await objectiveService.updateObjective(objectiveId, data);

    if (!objective) {
      return res.status(404).json({ message: "Objective not found" });
    }

    return res.status(200).json({ updatedObjective: objective });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteObjective = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No objective IDs provided for bulk delete" });
    }

    const result = await objectiveService.deleteObjective(selectedIds);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No objectives found for the provided IDs" });
    }

    return res.status(200).json({
      message: "Objectives deleted successfully",
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

exports.archiveObjectives = async (req, res) => {
  try {
    const { objectiveIds, archived } = req.body;

    // archive the objective
    const updatedObjectives = await objectiveService.archiveObjectives(
      objectiveIds,
      archived
    );

    // archive all tasks under the objective
    for (const objectiveId of objectiveIds) {
      const objectiveTasks = await objectiveService.getObjectiveTasks({
        _id: new mongoose.Types.ObjectId(objectiveId),
      });
      await taskService.archiveTasks(
        objectiveTasks.map((task) => task._id),
        archived
      );
    }
    return res.status(200).json({
      updatedObjectives,
      message: "Objectives moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
