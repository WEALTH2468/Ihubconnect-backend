const mongoose = require("mongoose");
const GoalService = require("../goal/goal.service");
const GoalRepository = require("../goal/goal.repository");
const {
  calculateParentStatusAndProgress,
} = require("../../../lib/iperformance/controller-utils");
const goalService = new GoalService(new GoalRepository());
class ObjectiveService {
  constructor(objectiveRepository) {
    this.objectiveRepository = objectiveRepository;
  }

  getQueryParams(filters) {
    let query = {};

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

    if (filters.goals?.length > 0) {
      query.goalId = {
        $in: filters.goals.map((goalId) => new mongoose.Types.ObjectId(goalId)),
      };
    }

    if (filters.userIds?.length > 0) {
      query.collaborators = {
        $in: filters.userIds.map(
          (userId) => new mongoose.Types.ObjectId(userId)
        ),
      };
    }

    if (filters.teamIds?.length > 0) {
      query.teams = { $in: filters.teamIds };
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

        query.endDate = {
          $gte: startOfWeek.getTime(),
          $lte: endOfWeek.getTime(),
        };
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

        query.endDate = {
          $gte: startOfMonth.getTime(),
          $lte: endOfMonth.getTime(),
        };
      }
    }

    if (filters.priority) {
      query.priority = { $regex: filters.priority, $options: "i" };
    }

    if (filters.startDate && filters.startDate !== "NaN") {
      query.startDate = { $gte: Number(filters.startDate) };
    }

    if (filters.endDate && filters.endDate !== "NaN") {
      query.endDate = { $lte: Number(filters.endDate) };
    }

    if (filters.view) {
      query.archived = filters.view === "archived" ? true : false;
    }

    console.log({ collaborators: query.collaborators });
    return query;
  }

  async createObjective(objective) {
    const newObjective = await this.objectiveRepository.createObjective(
      objective
    );

    if (newObjective.goalId) {
      await this.updateGoalProgressAndStatus(newObjective.goalId);
    }

    return newObjective;
  }

  async updateGoalProgressAndStatus(goalId) {
    if (!goalId) return;

    const goalObjectives = await goalService.getGoalObjectives({
      _id: goalId,
    });

    const { progress, parentStatus } =
      calculateParentStatusAndProgress(goalObjectives);

    console.log({ progress, parentStatus });

    return await goalService.updateGoal(goalId, {
      status: parentStatus,
      progress: progress,
    });
  }

  async getObjectives(filters) {
    const objectivesPerFetch = 20;
    const limit = objectivesPerFetch;
    const skip = filters.count * objectivesPerFetch;
    const query = this.getQueryParams(filters);
    return await this.objectiveRepository.getObjectives(query, skip, limit);
  }

  async getObjectiveTasks(filters) {
    const objectiveWithTasks = await this.objectiveRepository.getObjectiveTasks(
      filters
    );

    if (objectiveWithTasks.length > 0) {
      return objectiveWithTasks[0].tasks;
    }
    return [];
  }

  async getObjectiveById(id) {
    return await this.objectiveRepository.getObjectiveById(id);
  }

  async updateObjective(id, objective) {
    const updatedObjective = await this.objectiveRepository.updateObjectiveById(
      id,
      objective
    );

    if (updatedObjective && updatedObjective.goalId) {
      await this.updateGoalProgressAndStatus(updatedObjective.goalId);
    }

    return await this.getObjectiveById(updatedObjective._id);
  }

  async deleteObjective(ids) {
    return await this.objectiveRepository.deleteObjectiveByIds(ids);
  }

  async archiveObjectives(ids, archived) {
    return await this.objectiveRepository.archiveObjectives(ids, archived);
  }
}

module.exports = ObjectiveService;
