const Goal = require("../../modules/iperformance/goal/goal.model");
const Task = require("../../modules/iperformance/task/task.model");

exports.getTopTenGoals = async (companyDomain, queryParams) => {
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

    const topTenGoals = await Goal.find({
      priority: "Urgent",
      companyDomain,
    }).limit(10);

    const topTenGoalsWithProgress = await Promise.all(
      topTenGoals.map(async (goal) => {
        const tasks = await Task.find({
          goalId: goal._id,
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
          _id: goal._id,
          title: goal.title,
          priority: goal.priority,
          progress,
        };
      })
    );

    return topTenGoalsWithProgress;
  } catch (err) {
    throw err;
  }
};
