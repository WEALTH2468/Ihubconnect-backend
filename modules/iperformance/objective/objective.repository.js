const { default: mongoose } = require("mongoose");
const BaseRepository = require("../base.repository");
const Objective = require("./objective.model");

class ObjectiveRepository extends BaseRepository {
  constructor() {
    super(Objective);
  }
  async createObjective(objective) {
    return await this.create(objective);
  }

  async getObjectives(query, skip, limit) {
    const objectives = await this.aggregate(query, [
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
      objectives,
      meta: {
        totalRowCount,
      },
    };
  }

  async getObjectiveTasks(query) {
    const objectiveWithTasks = await this.aggregate(query, [
      {
        $lookup: {
          from: "task2",
          localField: "_id",
          foreignField: "objectiveId",
          as: "tasks",
        },
      },
    ]);
    return objectiveWithTasks;
  }

  async getObjectiveById(id) {
    const goals = await this.aggregate(
      { _id: new mongoose.Types.ObjectId(id) },
      [
        {
          $lookup: {
            from: "task2",
            localField: "_id",
            foreignField: "objectiveId",
            as: "tasks",
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

  async updateObjectiveById(id, objective) {
    return await this.updateById(id, objective);
  }

  async deleteObjectiveByIds(ids) {
    const result = await this.deleteByIds(ids);
    return { deletedCount: result.deletedCount, ids };
  }

  async archiveObjectives(ids, archived) {
    const result = await this.updateMany({ _id: { $in: ids } }, { archived });

    return result;
  }
}

module.exports = ObjectiveRepository;
