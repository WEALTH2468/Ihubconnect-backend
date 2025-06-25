const TaskService = require("./task.service");
const TaskRepository = require("./task.repository");
const taskService = new TaskService(new TaskRepository());

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      weight,
      owner,
      createdAt,
      status,
      period,
      startDate,
      endDate,
    } = req.body;
    const userId = req.auth.userId;

    const data = {
      userId,
      title,
      weight,
      owner,
      createdAt,
      status,
      period,
      startDate,
      endDate,
      ...req.body,
    };

    const newTask = await taskService.createTask(data);
    return res
      .status(201)
      .json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation Error when creating task",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Task already exist" });
    }
    return res.status(500).json({ message: "An unexpected error occured" });
  }
};

exports.createSubtask = async (req, res) => {
  try {
    const {
      title,
      weight,
      owner,
      createdAt,
      status,
      period,
      startDate,
      endDate,
      reviewers,
    } = req.body.subTask;

    const { parentId, progress, parentStatus } = req.body;

    const userId = req.auth.userId;

    const data = {
      userId,
      title,
      weight,
      owner,
      createdAt,
      status,
      period,
      startDate,
      endDate,
      isSubtask: true,
      reviewers,
    };

    const parentData = {
      parentId,
      parentStatus,
      progress,
    };

    const parentTask = await taskService.getTaskById(parentId);
    if (!parentTask) {
      return res.status(404).json({ message: "Parent task does not exist" });
    }

    const newSubtask = await taskService.createSubtask(data, parentData);
    return res.status(201).json({
      message: "Subtask created successfully",
      parentId,
      subtask: newSubtask,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error occured when creating sub task",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Task already exists" });
    }
    return res.status(500).json({ message: "An unexpected error occured" });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filters = {
      count: Number(req.query.count) || 0,
      searchQuery: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      due: req.query.due,
      priority: req.query.priority,
      statuses: JSON.parse(req.query.status || "[]"),
      weights: JSON.parse(req.query.weights || "[]"),
      goals: JSON.parse(req.query.goals || "[]"),
      period: req.query.period,
      objectives: JSON.parse(req.query.objectives || "[]"),
      userIds: JSON.parse(req.query.users || "[]"),
      view: req.query.view,
    };

    const results = await taskService.getTasks(filters, req.auth.userId);
    return res.status(200).json(results);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name == "CompanyDomainError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error({ error });
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const data = req.body;
    let task;
    if (data.parentId) {
      task = await taskService.updateSubTask(taskId, data);
    } else {
      task = await taskService.updateTask(taskId, data);
    }

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ updatedTask: task });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);
    const result = await taskService.deleteTask(selectedIds);
    return res.status(200).json({
      message: "Task deleted successfully",
      ids: result.ids,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.moveTasks = async (req, res) => {
  try {
    const { ids, periodId } = req.body;
    const result = await taskService.moveTasks(ids, periodId);
    return res.status(200).json({
      message: "Task moved successfully",
      ...result,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.countUserTasks = async (req, res) => {
  try {
    const idArr = [req.params.id];
    const count = await taskService.countUserTasks(idArr);
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.archiveTasks = async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ message: "Task ids must be arrays" });
    }

    const updatedTasks = await taskService.archiveTasks(taskIds);

    return res.status(200).json({
      updatedTasks,
      message: "Tasks moved successfully!",
    });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};
