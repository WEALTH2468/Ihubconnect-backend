const Objective = require("../../modules/iperformance/objective/objective.model");
const Task = require("../../modules/iperformance/task/task.model");

exports.getTopTenObjectives = async (companyDomain, queryParams) => {
  try {
    const period = queryParams.period;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    let query = { isSubtask: false, companyDomain };
    if (period) {
      query.period = period;
    }

    if (startDate && startDate !== "NaN") {
      query.startDate = { $gte: Number(startDate) };
    }

    if (endDate && endDate !== "NaN") {
      query.endDate = { $lte: Number(endDate) };
    }

    const topTenObjectives = await Objective.find({
      priority: "Urgent",
      companyDomain,
    }).limit(10);

    const topTenObjectivesWithProgress = await Promise.all(
      topTenObjectives.map(async (objective) => {
        const tasks = await Task.find({
          objectiveId: objective._id,
          companyDomain,
          ...query,
        }).lean();

        const completedTasks = tasks.filter(
          (task) => task.status === "Completed"
        );
        const progress =
          tasks.length > 0
            ? Math.floor((completedTasks.length / tasks.length) * 100)
            : 0;

        return {
          _id: objective._id,
          title: objective.title,
          priority: objective.priority,
          progress,
        };
      })
    );

    return topTenObjectivesWithProgress;
  } catch (err) {
    throw err;
  }
};
