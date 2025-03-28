const { default: mongoose } = require("mongoose");

class GoalService {
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
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

    if (filters.categoryIds?.length > 0) {
      query.category = {
        $in: filters.categoryIds,
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

    return query;
  }

  async createGoal(goal) {
    return await this.goalRepository.createGoal(goal);
  }

  async getGoals(filters) {
    const goalsPerFetch = 20;
    const limit = goalsPerFetch;
    const skip = filters.count * goalsPerFetch;
    const query = this.getQueryParams(filters);
    return await this.goalRepository.getGoals(query, skip, limit);
  }

  async getGoalObjectives(filters) {
    const goalWithObjectives = await this.goalRepository.getGoalObjectives(
      filters
    );
    if (goalWithObjectives.length > 0) {
      return goalWithObjectives[0].objectives;
    }
    return [];
  }

  async getGoalById(id) {
    return await this.goalRepository.getGoalById(id);
  }

  async archiveGoals(ids, archived) {
    await this.goalRepository.archiveGoals(ids, archived);
  }
  async updateGoal(id, goal) {
    const updatedGoal = await this.goalRepository.updateGoalById(id, goal);
    return await this.getGoalById(updatedGoal._id);
  }

  async deleteGoal(ids) {
    return await this.goalRepository.deleteGoalByIds(ids);
  }
}

module.exports = GoalService;
