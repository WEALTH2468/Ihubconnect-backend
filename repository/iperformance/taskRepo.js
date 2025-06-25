const mongoose = require("mongoose");
const { format, addMonths } = require("date-fns");
const Task = require("../../modules/iperformance/task/task.model");
const Weight = require("../../models/weight");
const Team = require("../../models/team");

const generateMonthList = (start, end) => {
  let months = [];
  let currentDate = new Date(Number(start));

  while (currentDate.getTime() <= Number(end)) {
    months.push(format(currentDate, "MMM yyyy"));
    currentDate = addMonths(currentDate, 1);
  }

  return months;
};

exports.getTaskSummary = async (companyDomain, queryParams) => {
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

    const tasks = await Task.find(query).populate("weight");

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "Completed"
    ).length;

    return { totalTasks, completedTasks };
  } catch (err) {
    throw err;
  }
};

exports.getTaskSummaryByStatus = async (queryParams) => {
  const period = queryParams.period;
  const startDate = queryParams.startDate;
  const endDate = queryParams.endDate;
  let query = { isSubtask: false };

  if (period) {
    query.period = new mongoose.Types.ObjectId(period);
  }

  if (startDate && startDate !== "NaN") {
    query.startDate = { $gte: Number(startDate) };
  }

  if (endDate && endDate !== "NaN") {
    query.endDate = { $lte: Number(endDate) };
  }

  try {
    const tasks = await Task.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedSummary = {
      notStarted: { name: "Not Started", value: 0 },
      inProgress: { name: "In Progress", value: 0 },
      completed: { name: "Completed", value: 0 },
    };

    const statusMapping = {
      "Not started": "notStarted",
      "In progress": "inProgress",
      Completed: "completed",
    };

    const totalTasks = await Task.countDocuments(query);

    // Update the formatted summary dynamically
    tasks.forEach((item) => {
      const statusKey = item._id === "In review" ? "In progress" : item._id;

      const key = statusMapping[statusKey];

      if (key) {
        formattedSummary[key].value += Math.floor(
          (item.count / totalTasks) * 100
        );
      }
    });

    return formattedSummary;
  } catch (err) {
    throw err;
  }
};

exports.getMonthCategories = async (queryParams) => {
  // Fetch all tasks
  const period = queryParams.period;
  const weights = JSON.parse(queryParams.weights || "[]");
  const teamId = queryParams.team;
  const today = new Date(Date.now());

  const startDate =
    queryParams.startDate ||
    new Date(today.setUTCFullYear(today.getFullYear(), 0, 1)).getTime();

  const endDate =
    queryParams.endDate ||
    new Date(today.setUTCFullYear(today.getFullYear(), 11, 30)).getTime();

  let query = {};

  if (period) {
    query.period = period;
  }

  // if (weights.length > 0) {
  //   query.weight = {
  //     $in: weights.map((weightId) => {
  //       const weightObjId = new mongoose.Types.ObjectId(weightId);
  //       return weightObjId;
  //     }),
  //   };
  // }

  if (startDate && startDate !== "NaN") {
    query.startDate = { $gte: Number(startDate) };
  }

  if (endDate && endDate !== "NaN") {
    query.endDate = { $lte: Number(endDate) };
  }

  // if (teamId) {
  //   // get the team data
  //   const team = await Team.aggregate([
  //     {
  //       $match: { _id: new mongoose.Types.ObjectId(teamId) },
  //     },
  //     {
  //       $lookup: {
  //         from: "teammates",
  //         localField: "_id",
  //         foreignField: "team",
  //         as: "members",
  //       },
  //     },
  //   ]);

  //   const users = team[0].members.map((member) => member.user);
  //   if (users.length > 0) {
  //     query.owner = { $in: users };
  //   }
  // }

  // const tasks = await Task.find(query);

  // Extract unique months from startDate
  // const monthCategories = tasks
  //   .map((task) => {
  //     if (task.startDate) {
  //       return format(new Date(task.startDate), "MMM yyyy");
  //     }
  //   })
  //   .filter((value, index, self) => {
  //     return self.indexOf(value) === index && value !== undefined; // Format date as "Jan 2023"
  //   }) // Remove duplicates
  //   .sort((a, b) => new Date(a) - new Date(b)); // Sort by chronological order

  const monthCategories = generateMonthList(startDate, endDate);

  return monthCategories;
};

exports.getWorkloadSeries = async (companyDomain, queryParams, categories) => {
  // Fetch all tasks
  const period = queryParams.period;
  const teamId = queryParams.team;

  const today = new Date(Date.now());
  const startDate = queryParams.startDate
    ? Number(queryParams.startDate)
    : new Date(Date.UTC(today.getFullYear(), 0, 1, 0, 0, 0)).getTime();
  const endDate = queryParams.endDate
    ? Number(queryParams.endDate)
    : new Date(Date.UTC(today.getFullYear(), 11, 31, 23, 59, 59)).getTime();

  const taskQuery = { companyDomain };

  if (period) {
    taskQuery.period = period;
  }

  if (startDate && startDate !== "NaN") {
    taskQuery.startDate = { $gte: Number(startDate) };
  }

  if (endDate && endDate !== "NaN") {
    taskQuery.endDate = { $lte: Number(endDate) };
  }

  if (teamId) {
    // get the team data
    const team = await Team.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(teamId) },
      },
      {
        $lookup: {
          from: "teammates",
          localField: "_id",
          foreignField: "team",
          as: "members",
        },
      },
    ]);

    const users = team[0].members.map((member) => member.user);
    if (users.length > 0) {
      taskQuery.owner = { $in: users };
    }
  }

  const tasks = await Task.find(taskQuery).populate("weight");
  const weightIds = JSON.parse(queryParams.weights || "[]");

  if (weightIds.length === 0) {
    const series = [{ data: new Array(categories.length).fill(0) }];

    tasks.forEach((task) => {
      if (task.startDate) {
        const taskMonth = format(new Date(task.startDate), "MMM yyyy");
        const categoryIndex = categories.indexOf(taskMonth);

        if (categoryIndex !== -1 && task.weight?.name) {
          series[0].data[categoryIndex] += 1;
        }
      }
    });
    return series;
  }

  const query = {
    _id: {
      $in: weightIds.map((weightId) => {
        const weightObjId = new mongoose.Types.ObjectId(weightId);
        return weightObjId;
      }),
    },
    companyDomain,
  };

  const weights = await Weight.find(query);

  // Initialize the series object
  const series = weights.map((weight) => {
    if (weight.name) {
      return {
        name: weight.name,
        data: categories.map(() => 0), // Create an array of zeros for each category
      };
    }
  });

  tasks.forEach((task) => {
    if (task.startDate) {
      const taskMonth = format(new Date(task.startDate), "MMM yyyy");

      const categoryIndex = categories.indexOf(taskMonth);

      if (categoryIndex !== -1 && task.weight?.name) {
        const seriesItem = series.find(
          (item) => item.name === task.weight.name
        );

        if (seriesItem) {
          seriesItem.data[categoryIndex] += 1;
        }
      }
    }
  });

  return series.sort((a, b) => a.name.localeCompare(b.name));
};
