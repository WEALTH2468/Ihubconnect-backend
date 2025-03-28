const { default: mongoose } = require("mongoose");
const BaseRepository = require("../base.repository");
const Goal = require("./goal.model");

class GoalRepository extends BaseRepository {
  constructor() {
    super(Goal);
  }
  async createGoal(goal) {
    return await this.create(goal);
  }

  async getGoals(query, skip, limit) {
    const goals = await this.aggregate(query, [
      {
        $lookup: {
          from: "objectives",
          localField: "_id",
          foreignField: "goalId",
          as: "objectives",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "collaborators",
          foreignField: "_id",
          as: "collaborators",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await this.count(query);

    return {
      goals,
      meta: {
        totalRowCount,
      },
    };
  }

  async getGoalById(id) {
    const goals = await this.aggregate(
      { _id: new mongoose.Types.ObjectId(id) },
      [
        {
          $lookup: {
            from: "objectives",
            localField: "_id",
            foreignField: "goalId",
            as: "objectives",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "collaborators",
            foreignField: "_id",
            as: "collaborators",
          },
        },
      ]
    );

    return goals[0];
  }

  async getGoalObjectives(query) {
    const objectiveWithTasks = await this.aggregate(query, [
      {
        $lookup: {
          from: "objectives",
          localField: "_id",
          foreignField: "goalId",
          as: "objectives",
        },
      },
    ]);
    return objectiveWithTasks;
  }

  async updateGoalById(id, goal) {
    return this.updateById(id, goal);
  }

  async archiveGoals(ids, archived) {
    const result = await this.updateMany({ _id: { $in: ids } }, { archived });

    return result;
  }

  async deleteGoalByIds(ids) {
    const result = await this.deleteByIds(ids);
    return { deletedCount: result.deletedCount, ids };
  }
}

module.exports = GoalRepository;
