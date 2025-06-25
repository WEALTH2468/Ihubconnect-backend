const Task = require("../../modules/iperformance/task/task.model");
const User = require("../../models/user");
const Team = require("../../models/team");
const {
  getTaskSummary,
  getTaskSummaryByStatus,
  getWorkloadSeries,
  getMonthCategories,
} = require("../../repository/iperformance/taskRepo");
const {
  getChallengeSummary,
} = require("../../repository/iperformance/challengeRepo");
const { getTopTenGoals } = require("../../repository/iperformance/goalRepo");
const { getRiskSummary } = require("../../repository/iperformance/riskRepo");
const { getTotalTeammate } = require("../../repository/team/teammateRepo");

const {
  calculatePercentageIncrease,
  getUserCompliance,
  getMonthBoundaries,
  accumulateUserStats,
  calculatePerformance,
  accumulateTeamUserStats,
  transformStats,
  mergeArray,
  getTeamCompliance,
} = require("../../lib/iperformance/controller-utils");
const {
  getTopTenObjectives,
} = require("../../repository/iperformance/objectiveRepo");

// #endregion

exports.getSummary = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const totalTeammates = await getTotalTeammate(req.auth.companyDomain);
    const taskSummary = await getTaskSummary(
      req.auth.companyDomain,
      queryParams
    );
    const challengeSummary = await getChallengeSummary(req.auth.companyDomain);
    const riskSummary = await getRiskSummary(req.auth.companyDomain);

    const summary = [
      {
        id: 1,
        name: "Number of Employees",
        count: totalTeammates,
      },
      {
        id: 2,
        name: "Tasks Completion Rate",
        count: taskSummary.totalTasks,
        progress:
          taskSummary.totalTasks === 0
            ? "0%"
            : `${Math.floor(
                (taskSummary.completedTasks / taskSummary.totalTasks) * 100
              )}%`,
      },
      {
        id: 3,
        name: "Resolved / Challenges",
        count: challengeSummary.totalChallenges,
        progress:
          challengeSummary.totalChallenges === 0
            ? "0%"
            : `${Math.floor(
                (challengeSummary.completedChallenges /
                  challengeSummary.totalChallenges) *
                  100
              )}%`,
      },
      {
        id: 4,
        name: "Mitigated / Risks",
        count: riskSummary.totalRisks,
        progress:
          riskSummary.totalRisks === 0
            ? "0%"
            : `${Math.floor(
                (riskSummary.completedRisks / riskSummary.totalRisks) * 100
              )}%`,
      },
    ];

    return res.status(200).json({ summary });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProgress = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const progress = await getTaskSummaryByStatus(queryParams);
    return res.status(200).json(progress);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getWorkload = async (req, res) => {
  try {
    const queryParams = req.query;
    const monthCategories = await getMonthCategories(queryParams);
    const series = await getWorkloadSeries(
      req.auth.companyDomain,
      queryParams,
      monthCategories
    );
    return res
      .status(200)
      .json({ workload: { categories: monthCategories, series: series } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTopGoals = async (req, res) => {
  try {
    const queryParams = req.query;
    const topGoals = await getTopTenGoals(req.auth.companyDomain, queryParams);
    return res.status(200).json(topGoals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTopObjectives = async (req, res, next) => {
  try {
    const queryParams = req.query;
    const topObjectives = await getTopTenObjectives(
      req.auth.companyDomain,
      queryParams
    );
    return res.status(200).json(topObjectives);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTopUsers = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const { beginningOfMonth, endOfMonth } = getMonthBoundaries(currentDate);

    const users = await User.find({ companyDomain: req.auth.companyDomain });
    //const tasks = await getMonthlyTasks(beginningOfMonth, endOfMonth);
    const queryParams = req.query;
    const period = queryParams.period;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    let query = { isSubtask: false, companyDomain: req.auth.companyDomain };

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
    const userStats = accumulateUserStats(tasks, users);
    const sortedUsersPerformance = calculatePerformance(userStats, users);

    return res.status(200).json({ topUsers: sortedUsersPerformance });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTopTeams = async (req, res, next) => {
  try {
    // get all teams
    const teams = await Team.aggregate([
      { $match: { companyDomain: req.auth.companyDomain } },
      {
        $lookup: {
          from: "teammates",
          localField: "_id",
          foreignField: "team",
          as: "members",
        },
      },
    ]);

    const queryParams = req.query;
    const period = queryParams.period;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    let query = { isSubtask: false, companyDomain: req.auth.companyDomain };

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
    let topTeams = [];

    teams.forEach((team) => {
      const memberIds = team.members.map((member) => member.user.toString());

      if (memberIds.length > 0) {
        // get all tasks for the team members
        const membersTasks = tasks.filter((task) => {
          return task.owner.some((owner) =>
            memberIds.includes(owner.toString())
          );
        });

        // compile the the stats for each user in the team
        const userStats = accumulateTeamUserStats(
          membersTasks,
          team.members,
          (field = "user")
        );

        // convert the object to an array
        const userStatsArray = Object.entries(userStats).map(transformStats);

        // merge the stats of all the users in the team to a single object
        const mergedPerformanceObj = mergeArray(userStatsArray);

        const teamCompliance = getTeamCompliance([team], membersTasks);

        mergedPerformanceObj.teamCompliance = `${teamCompliance.toFixed(0)}%`;
        // compute the performance based on the stats calculated
        const teamPerformance =
          (mergedPerformanceObj.completedWeight /
            mergedPerformanceObj.totalWeight) *
          100;
        mergedPerformanceObj.performance = `${teamPerformance.toFixed(0)}%`;

        topTeams.push({
          teamPerformance: mergedPerformanceObj,
          teamId: team._id,
          teamName: team.name,
          parent: team.parent?.toString() || null,
        });
      } else {
        const mergedPerformanceObj = {
          performance: undefined,
          completedWeight: undefined,
          totalWeight: undefined,
          weightCount: undefined,
          compliance: undefined,
        };
        topTeams.push({
          teamPerformance: mergedPerformanceObj,
          teamName: team.name,
          parent: team.parent?.toString() || null,
          teamId: team._id,
        });
      }
    });

    return res.status(200).json({
      topTeams: topTeams.sort(
        (a, b) => b.teamPerformance.performance - a.teamPerformance.performance
      ),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
