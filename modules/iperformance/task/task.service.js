const mongoose = require("mongoose");
const ObjectiveService = require("../objective/objective.service");
const ObjectiveRepository = require("../objective/objective.repository");

const {
  calculateParentStatusAndProgress,
} = require("../../../lib/iperformance/controller-utils");
const objectiveService = new ObjectiveService(new ObjectiveRepository());

class TaskService {
  constructor(taskRepository) {
    this.taskRepository = taskRepository;
  }

  getQueryParams(filters, userId) {
    let query = { isSubtask: false };
    if (
      filters.searchQuery &&
      filters.searchQuery.length > 0 &&
      filters.searchQuery !== "undefined"
    ) {
      query.$or = [
        { code: { $regex: filters.searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
        { title: { $regex: filters.searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
    }

    if (filters.userIds?.length > 0 && filters.due !== "Due for review") {
      query.owner = {
        $in: filters.userIds.map(
          (userId) => new mongoose.Types.ObjectId(userId)
        ),
      };
    }

    if (filters.due) {
      if (filters.due === "Due today") {
        const startOfDay = new Date().setHours(0, 0, 0, 1);
        const endOfDay = new Date().setHours(23, 59, 59, 999);
        query.endDate = { $gte: startOfDay, $lte: endOfDay };
      } else if (filters.due === "Due this week") {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 1);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        query.endDate = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (filters.due === "Due this month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 1);

        const endOfMonth = new Date(
          startOfMonth.getFullYear(),
          startOfMonth.getMonth() + 1,
          0
        );
        endOfMonth.setHours(23, 59, 59, 999);

        query.endDate = { $gte: startOfMonth, $lte: endOfMonth };
      } else if (filters.due === "Due for review") {
        query.status = { $in: ["In review"] };
        query.reviewers = { $in: [new mongoose.Types.ObjectId(userId)] };
      }
    }

    if (filters.priority) {
      query.priority = { $regex: filters.priority, $options: "i" };
    }

    if (filters.view === "archived" && !filters.period) {
      delete query.period;
    } else {
      query.period = filters.period
        ? new mongoose.Types.ObjectId(filters.period)
        : null;
    }

    if (filters.statuses?.length > 0) {
      const statusFilter = [];
      if (filters.statuses[0]) statusFilter.push("Completed");
      if (filters.statuses[1]) statusFilter.push("In review");
      if (filters.statuses[2]) statusFilter.push("In progress");
      if (filters.statuses[3]) statusFilter.push("Not started");

      if (statusFilter.length > 0) {
        query.status = { $in: statusFilter };
      }
    }

    if (filters.weights?.length > 0) {
      query.weight = {
        $in: filters.weights.map(
          (weightId) => new mongoose.Types.ObjectId(weightId)
        ),
      };
    }

    if (filters.goals?.length > 0) {
      query.goalId = {
        $in: filters.goals.map((goalId) => new mongoose.Types.ObjectId(goalId)),
      };
    }

    if (filters.objectives?.length > 0) {
      query.objectiveId = {
        $in: filters.objectives.map(
          (objectiveId) => new mongoose.Types.ObjectId(objectiveId)
        ),
      };
    }

    if (filters.startDate && filters.startDate !== "NaN") {
      query.startDate = { $gte: Number(filters.startDate) };
    }

    if (filters.endDate && filters.endDate !== "NaN") {
      const endOfDay = new Date(Number(filters.endDate)).setUTCHours(
        23,
        59,
        59,
        999
      );
      query.endDate = { $lte: endOfDay };
    }

    if (filters.view && filters.view === "archived") {
      query.archived = true;
    } else {
      query.archived = false;
    }

    return query;
  }

  async getTaskById(id) {
    return await this.taskRepository.getTaskById(id);
  }

  async getTasks(filters, userId) {
    const tasksPerFetch = 20;
    const limit = tasksPerFetch;
    const skip = filters.count * tasksPerFetch;
    const query = this.getQueryParams(filters, userId);
    return await this.taskRepository.getTasks(query, skip, limit);
  }

  async createTask(task) {
    const newTask = await this.taskRepository.createTask(task);

    if (newTask.objectiveId) {
      await this.updateObjectiveProgressAndStatus(newTask.objectiveId);
    }

    return newTask;
  }

  async createSubtask(subtask, parentTask) {
    return await this.taskRepository.createSubtask(subtask, parentTask);
  }

  async updateObjectiveProgressAndStatus(objectiveId) {
    if (!objectiveId) return;

    const objectiveTasks = await objectiveService.getObjectiveTasks({
      _id: objectiveId,
    });

    const { progress, parentStatus } =
      calculateParentStatusAndProgress(objectiveTasks);

    return await objectiveService.updateObjective(objectiveId, {
      status: parentStatus,
      progress: progress,
    });
  }

  async updateTask(id, task) {
    const taskToUpdate = await this.taskRepository.getTaskById(id);
    const updatedTask = await this.taskRepository.updateTaskById(id, task);
    const hasUpdatedReviewers =
      Array.isArray(task.reviewers) &&
      (!Array.isArray(taskToUpdate.reviewers) ||
        taskToUpdate.reviewers.length !== task.reviewers.length ||
        taskToUpdate.reviewers.some((r, i) => r !== task.reviewers[i])); // check if the reviewers array has change so we can update the subtasks

    if (hasUpdatedReviewers) {
      await this.taskRepository.updateSubtasks(
        updatedTask.subtasks,
        task.reviewers
      );
    }

    if (updatedTask.objectiveId) {
      await this.updateObjectiveProgressAndStatus(updatedTask.objectiveId);
    }

    return await this.getTaskById(updatedTask._id);
  }

  async updateSubTask(id, task) {
    const updatedSubtask = this.updateTask(id, task);

    await this.taskRepository.updateTaskById(task.parentId, {
      status: task.parentStatus,
      progress: task.progress,
    });

    const parentTask = await this.getTaskById(task.parentId);

    if (parentTask.objectiveId) {
      const updatedObjective = await this.updateObjectiveProgressAndStatus(
        parentTask.objectiveId
      );
    }

    return updatedSubtask;
  }

  async deleteTask(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("No task IDs provided for bulk delete");
      }

      return await this.taskRepository.deleteTaskByIds(ids);
    } catch (error) {
      throw new Error(`Error deleting task: ${error.message}`);
    }
  }

  async moveTasks(ids, periodId) {
    return await this.taskRepository.moveTasks(ids, periodId);
  }

  async archiveTasks(ids, archived = true) {
    return await this.taskRepository.archiveTasks(ids, archived);
  }

  async countUserTasks(idArr) {
    try {
      return await this.taskRepository.countUserTasks(idArr);
    } catch (error) {
      throw new Error(`Error counting user tasks: ${error.message}`);
    }
  }
}

module.exports = TaskService;
