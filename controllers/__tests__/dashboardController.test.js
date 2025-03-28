const { getSummary, getProgress, getWorkload, getTopGoals, getTopObjectives } = require("../../controllers/dashboard/iperformance");
const { getTaskSummary, getTaskSummaryByStatus, getMonthCategories, getWorkloadSeries } = require("../../repository/iperformance/taskRepo");
const {
  getChallengeSummary,
} = require("../../repository/iperformance/challengeRepo");
const { getRiskSummary } = require("../../repository/iperformance/riskRepo");
const { getTotalTeammate } = require("../../repository/team/teammateRepo");
const { getTopTenGoals } = require("../../repository/iperformance/goalRepo");
const { getTopTenObjectives } = require("../../repository/iperformance/objectiveRepo");

// Mock the dependency
jest.mock("../../repository/iperformance/taskRepo");
jest.mock("../../repository/iperformance/challengeRepo");
jest.mock("../../repository/iperformance/riskRepo");
jest.mock("../../repository/team/teammateRepo");
jest.mock("../../repository/iperformance/goalRepo")
jest.mock("../../repository/iperformance/objectiveRepo")

describe("getSummary Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return task summary successfully", async () => {
    const totalTeammates = 10;
    const mockTaskSummary = { totalTasks: 10, completedTasks: 5 };
    const mockChallengeSummary = { totalChallenges: 3, completedChallenges: 1 };
    const mockRiskSummary = { totalRisks: 4, completedRisks: 2 };

    getTotalTeammate.mockResolvedValue(totalTeammates);
    getTaskSummary.mockResolvedValue(mockTaskSummary);
    getChallengeSummary.mockResolvedValue(mockChallengeSummary);
    getRiskSummary.mockResolvedValue(mockRiskSummary);

    await getSummary(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      summary: [
        {
          id: 1,
          name: "Number of Employees",
          count: totalTeammates,
        },
        {
          id: 2,
          name: "Tasks Completion Rate",
          count: mockTaskSummary.totalTasks,
          progress: `${Math.floor(
            (mockTaskSummary.completedTasks / mockTaskSummary.totalTasks) * 100
          )}%`,
        },
        {
          id: 3,
          name: "Resolved / Challenges",
          count: mockChallengeSummary.totalChallenges,
          progress: `${Math.floor(
            (mockChallengeSummary.completedChallenges /
              mockChallengeSummary.totalChallenges) *
            100
          )}%`,
        },
        {
          id: 4,
          name: "Mitigated / Risks",
          count: mockRiskSummary.totalRisks,
          progress: `${Math.floor(
            (mockRiskSummary.completedRisks / mockRiskSummary.totalRisks) * 100
          )}%`,
        },
      ],
    });
  });
});

describe("getProgress Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return the task summary progress successfully", async () => {
    const mockProgress = { notStarted: { name: "Not Started", value: 10 }, inProgress: { name: "In Progress", value: 3 }, completed: { name: "Completed", value: 4 } }
    getTaskSummaryByStatus.mockResolvedValue(mockProgress)

    await getProgress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProgress);
  })
})

describe("getWorkload Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return the task workload successfully", async () => {
    const monthCategories = ["Jan 2023",
      "Jan 2024",
      "Feb 2024",
      "Mar 2024",
      "Apr 2024",
      "May 2024"
    ]
    const series = [
      {
        "name": "Coding",
        "data": [10, 20, 30, 40, 89]
      },
      {
        "name": "Task",
        "data": [56, 34, 44, 89, 0]
      }
    ]

    getMonthCategories.mockResolvedValue(monthCategories);
    getWorkloadSeries.mockResolvedValue(series)


    await getWorkload(req, res, next);

    const mockWorkload = {
      "workload": {
        "categories": [
          "Jan 2023",
          "Jan 2024",
          "Feb 2024",
          "Mar 2024",
          "Apr 2024",
          "May 2024"
        ],
        "series": [
          {
            "name": "Coding",
            "data": [10, 20, 30, 40, 89]
          },
          {
            "name": "Task",
            "data": [56, 34, 44, 89, 0]
          }
        ]
      }
    }

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockWorkload);
  })
})

describe("getTopTenGoal Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return the top ten goals and the progress successfully", async () => {
    const mockTopTenGoals = [{_id: 1, title: "Goal 1", progress: 10}, {_id: 2, title: "Goal 2", progress: 20}]

    getTopTenGoals.mockResolvedValue(mockTopTenGoals);
    await getTopGoals(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTopTenGoals);
  })
})

describe("getTopTenObjective Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should return the top ten objectives and the progress successfully", async () => {
    const mockTopTenObjectives = [{_id: 1, title: "Objective 1", progress: 10}, {_id: 2, title: "Objective 2", progress: 20}]

    getTopTenObjectives.mockResolvedValue(mockTopTenObjectives);
    await getTopObjectives(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTopTenObjectives);
  })
})