const mongoose = require("mongoose");

const Task = require("../../models/iperformance/task");

const {
  updateObjectiveStatus,
} = require("../../lib/iperformance/controller-utils");

exports.addTask = async (req, res, next) => {
  try {
    const {
      parentId,
      userId,
      title,
      weight,
      owner,
      createdAt,
      status,
      parentStatus,
      progress,
      period,
      startDate,
      endDate,
    } = req.body;

    if (parentId) {
      // creating a subtask

      const data = req.body;
      const newSubtask = new Task({
        ...data.subTask,
        isSubtask: true,
        companyDomain: req.auth.companyDomain,
      });
      const savedSubtask = await newSubtask.save();

      try {
        const updatedTask = await Task.findByIdAndUpdate(
          parentId,
          {
            $push: { subtasks: savedSubtask._id },
            status: parentStatus,
            progress: progress,
          },
          { new: true }
        );

        if (updatedTask) {
          // update the objective the task belong to if needed
          updatedTask.objectiveId &&
            (await updateObjectiveStatus(updatedTask.objectiveId));

          return res.status(201).json({
            parentId,
            subtask: savedSubtask,
          });
        } else {
          return res.status(404).json({ message: "Parent task not found" });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
      }
    } else {
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
      };
      const newTask = new Task({
        userId: req.auth.userId,
        companyDomain: req.auth.companyDomain,
        ...req.body,
      });
      const savedTask = await newTask.save();

      // const populatedTask = await Task.findById(savedTask._id).populate([
      //   { path: "owner" },
      //   { path: "subtasks", populate: { path: "owner" } },
      // ]);

      return res.status(201).json({ task: savedTask });
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ error: "No task IDs provided for bulk delete" });
    }

    const result = await Task.deleteMany({
      _id: { $in: selectedIds },
      companyDomain: req.auth.companyDomain,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "No tasks found for the provided IDs" });
    }

    return res.status(200).json({
      message: `${result.deletedCount} tasks deleted successfully`,
      deletedIds: selectedIds,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getTask = async (req, res) => {
  const id = req.params.id;

  try {
    const task = await Task.findOne({
      _id: id,
      companyDomain: req.auth.companyDomain,
    }).populate([
      { path: "subtasks", populate: { path: "owner", model: "User" } },
      { path: "owner" },
    ]);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the task" });
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const tasksPerFetch = 20;
    const count = Number(req.query.count) || 0;

    const limit = tasksPerFetch;
    const skip = count * tasksPerFetch;
    const searchQuery = req.query.search;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const due = req.query.due;
    const priority = req.query.priority;
    const statuses = JSON.parse(req.query.status || "[]");
    const weights = JSON.parse(req.query.weights || "[]");
    const goals = JSON.parse(req.query.goals || "[]");
    const period = req.query.period;
    const objectives = JSON.parse(req.query.objectives || "[]");
    const userIds = JSON.parse(req.query.users || "[]");
    const view = req.query.view;

    let query = { isSubtask: false, companyDomain: req.auth.companyDomain };
    let tasks = [];

    if (searchQuery && searchQuery.length > 0 && searchQuery !== "undefined") {
      query.$or = [
        { code: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
        { title: { $regex: searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
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

    if (view === "archived" && !period) {
      delete query.period;
    } else {
      query.period = period || null;
    }
    // if (period) {
    //   query.period = period;
    // } else {
    //   query.period = null;
    // }

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

    if (weights.length > 0) {
      query.weight = { $in: weights };
    }

    if (goals.length > 0) {
      query.goalId = { $in: goals };
    }

    if (objectives.length > 0) {
      query.objectiveId = { $in: objectives };
    }

    if (userIds.length > 0) {
      query.owner = { $in: userIds };
    }

    if (startDate && startDate !== "NaN") {
      // filter by startDate timestamp
      query.startDate = { $gte: Number(startDate) };
    }

    if (endDate && endDate !== "NaN") {
      //filter by endDate timestamp
      query.endDate = { $lte: Number(endDate) };
    }

    if (view && view === "archived") {
      query.archived = true;
    } else {
      query.archived = false;
    }

    tasks = await Task.find(query)
      .populate([
        { path: "subtasks", populate: [{ path: "owner" }, { path: "weight" }] },
        { path: "owner" },
        { path: "weight" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalRowCount = await Task.countDocuments(query);

    return res.status(200).json({
      tasks,
      meta: {
        totalRowCount,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const taskData = req.body;

    // Update the task and return the updated document
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, companyDomain: req.auth.companyDomain },
      taskData,
      {
        new: true,
      }
    ).populate("subtasks");
    if (taskData.parentId) {
      // If the task is a subtask, update the parent task's status and progress
      const parentTask = await Task.find({
        _id: taskData.parentId,
        companyDomain: req.auth.companyDomain,
      }).populate("subtasks");

      await Task.findOneAndUpdate(
        { _id: taskData.parentId, companyDomain: req.auth.companyDomain },
        {
          status: taskData.parentStatus,
          progress: taskData.progress,
        },
        { new: true }
      );

      if (parentTask.objectiveId) {
        // update the objective the task belong to if needed
        await updateObjectiveStatus(
          parentTask.objectiveId,
          req.auth.companyDomain
        );
      }
    }

    if (updatedTask.objectiveId) {
      // update the objective the task belong to if needed
      await updateObjectiveStatus(
        updatedTask.objectiveId,
        req.auth.companyDomain
      );
    }

    if (updatedTask) {
      return res.status(200).json({
        updatedTask,
        message: "Updated successfully!",
      });
    } else {
      return res.status(404).json({
        message: "Task not found!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.moveTask = async (req, res) => {
  try {
    const { ids, periodId } = req.body;

    // Update the tasks and return the updated documents
    const updatedTasks = await Task.updateMany(
      { _id: { $in: ids }, companyDomain: req.auth.companyDomain },
      { period: periodId, archived: false },
      { new: true }
    );
    return res.status(200).json({
      updatedTasks,
      message: "Tasks moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.archiveTask = async (req, res) => {
  try {
    const { taskIds } = req.body;

    // Update the tasks and return the updated documents
    const updatedTasks = await Task.updateMany(
      { _id: { $in: taskIds }, companyDomain: req.auth.companyDomain },
      { archived: true },
      { new: true }
    );
    return res.status(200).json({
      updatedTasks,
      message: "Tasks moved successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getTaskCount = async (req, res) => {
  try {
    let query = { isSubtask: false, companyDomain: req.auth.companyDomain };
    const idArr = [req.params.id];

    if (idArr.length > 0) {
      query.owner = { $in: idArr };
    }

    const totalRowCount = await Task.countDocuments(query);

    return res.status(200).json({ totalRowCount });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};
