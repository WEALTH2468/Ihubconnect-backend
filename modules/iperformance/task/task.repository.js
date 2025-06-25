const { default: mongoose } = require("mongoose");
const BaseRepository = require("../base.repository");
const Task = require("./task.model");

// TODO: Delete this later
const requestContext = require("../../../request.context");
const Period = require("../../../models/iperformance/period");

class TaskRepository extends BaseRepository {
  constructor() {
    super(Task);
  }

  async getTaskById(id) {
    return await this.findById(new mongoose.Types.ObjectId(id), [
      {
        path: "subtasks",
        populate: [
          { path: "owner" },
          { path: "weight" },
          { path: "reviewers" },
        ],
      },
      { path: "owner" },
      { path: "reviewers" },
      { path: "weight" },
    ]);
  }

  async getTasks(query, skip, limit) {
    const tasks = await this.find(query, skip, limit, [
      {
        path: "subtasks",
        populate: [
          { path: "owner" },
          { path: "weight" },
          { path: "reviewers" },
        ],
      },
      { path: "owner" },
      { path: "reviewers" },
      { path: "weight" },
    ]);

    const totalRowCount = await this.count(query);

    return {
      tasks,
      meta: {
        totalRowCount,
      },
    };
  }

  async createTask(task) {
    const savedTask = await this.create(task);
    const taskInDb = await this.getTaskById(savedTask._id);
    return taskInDb;
  }

  async createSubtask(subtask, parentTask) {
    const savedSubtask = await this.createTask(subtask); // create sub task

    // update parent task status and progress
    await this.updateTaskById(parentTask.parentId, {
      $push: { subtasks: savedSubtask._id },
      status: parentTask.parentStatus,
      progress: parentTask.progress,
    });

    return savedSubtask;
  }

  async updateTaskById(id, task) {
    return await this.updateById(id, task);
  }
  async updateSubtasks(subtasks, reviewers) {
    const bulkUpdatePromises = subtasks.map((subtask) =>
      this.updateById(subtask, { $set: { reviewers, reviewers } })
    );

    await Promise.all(bulkUpdatePromises);
  }
  async deleteTaskByIds(ids) {
    return await this.deleteByIds(ids);
  }

  // TODO: change period.findOne to service
  async moveTasks(ids, periodId) {
    try {
      const errorIds = [];

      ids.forEach(async (id) => {
        const task = await this.getTaskById(id);
        if (!task) {
          errorIds.push(id);
        }
      });

      // TODO: change to service
      const period = await Period.findOne({
        status: "In progress",
        companyDomain: requestContext.get("companyDomain"),
      });

      await this.updateMany(
        { _id: { $in: ids.filter((id) => !errorIds.includes(id)) } },
        {
          period: periodId,
          archived: false,
          startDate: period.startDate,
          endDate: period.endDate,
        }
      );
      return { ids: ids.filter((id) => !errorIds.includes(id)), errorIds };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async archiveTasks(ids, archived) {
    this.updateMany({ _id: { $in: ids } }, { archived: archived });
  }

  async countUserTasks(idArr) {
    try {
      let query = {};
      if (idArr < 1) {
        throw new Error("Id is required");
      }
      if (idArr.length > 0) {
        query.owner = { $in: idArr };
      }
      const totalRowCount = await this.count(query);
      return totalRowCount;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = TaskRepository;
