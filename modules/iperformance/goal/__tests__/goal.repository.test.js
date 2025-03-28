const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Goal = require("../goal.model");
const GoalRepository = require("../goal.repository");
const GoalService = require("../goal.service");

const goalRepository = new GoalRepository();
const goalService = new GoalService(goalRepository);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Goal.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GoalRepository - getGoals", () => {
  it("should get goals with pagination", async () => {
    await Goal.create([
      { title: "Goal 1", status: "Not started" },
      { title: "Goal 2", status: "In progress" },
    ]);

    const result = await goalRepository.getGoals({}, 0, 10);

    expect(result.goals.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
  });
  it("should return empty if no goals exist", async () => {
    const result = await goalRepository.getGoals({}, 0, 10);

    expect(result.goals.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });

  it("should filter goals by status", async () => {
    await Goal.create([
      { title: "Goal 1", status: "Not started" },
      { title: "Goal 2", status: "Completed" },
    ]);

    const query = goalService.getQueryParams({
      statuses: [true, false, false, false],
    });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].status).toBe("Completed");
  });

  it("should filter goals by priority", async () => {
    await Goal.create([
      { title: "Goal 1", priority: "High" },
      { title: "Goal 2", priority: "Low" },
    ]);

    const query = goalService.getQueryParams({ priority: "High" });
    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].priority).toBe("High");
  });

  it("should filter goals due today", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    await Goal.create([
      { title: "Goal 1", endDate: today },
      { title: "Goal 2", endDate: new Date(today.getTime() - 86400000) }, // Yesterday
    ]);

    const query = goalService.getQueryParams({ due: "Due today" });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].title).toBe("Goal 1");
  });

  it("should filter goals due this week", async () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    await Goal.create([
      { title: "Goal 1", endDate: new Date(startOfWeek).getTime() },
      { title: "Goal 2", endDate: new Date(endOfWeek).getTime() },
      {
        title: "Goal 3",
        endDate: new Date(endOfWeek.getTime() + 86400000).getTime(),
      }, // Next week
    ]);

    const query = goalService.getQueryParams({ due: "Due this week" });
    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(2);
  });
  it("should filter goals due this month", async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 1);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    await Goal.create([
      { title: "Goal 1", endDate: new Date(startOfMonth).getTime() },
      { title: "Goal 2", endDate: new Date(endOfMonth).getTime() },
      {
        title: "Goal 3",
        endDate: new Date(endOfMonth.getTime() + 86400000).getTime(),
      }, // Next month
    ]);

    const query = goalService.getQueryParams({ due: "Due this month" });
    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(2);
  });

  it("should filter goals by teams", async () => {
    const teamIds = ["65c06be549d260f9aeb86c7d", "65c06be549d260f9aeb86c7e"];
    await Goal.create([
      { title: "Goal 1", teams: [teamIds[0]] },
      { title: "Goal 2", teams: [teamIds[1]] },
      { title: "Goal 3", teams: ["otherTeamId"] },
    ]);

    const query = goalService.getQueryParams({ teamIds });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(2);
  });

  it("should filter goals by categories", async () => {
    const categoryIds = [
      "65c06be549d260f9aeb86c7f",
      "65c06be549d260f9aeb86c80",
    ];
    await Goal.create([
      {
        title: "Goal 1",
        category: new mongoose.Types.ObjectId(categoryIds[0]),
      },
      {
        title: "Goal 2",
        category: new mongoose.Types.ObjectId(categoryIds[1]),
      },
      { title: "Goal 3", category: new mongoose.Types.ObjectId() },
    ]);

    const query = goalService.getQueryParams({ categoryIds: categoryIds });
    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(2);
  });

  it("should filter goals by userIds", async () => {
    const userIds = ["65c06be549d260f9aeb86c81", "65c06be549d260f9aeb86c82"];
    await Goal.create([
      { title: "Goal 1", collaborators: [userIds[0]] },
      { title: "Goal 2", collaborators: [userIds[1]] },
      { title: "Goal 3", collaborators: ["otherUserId"] },
    ]);

    const query = goalService.getQueryParams({ userIds });
    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(2);
  });
  it("should filter goals by startDate", async () => {
    const startDate = new Date().getTime();

    await Goal.create([
      { title: "Goal 1", startDate },
      {
        title: "Goal 2",
        startDate: new Date(startDate - 86400000).getTime(),
      }, // Yesterday
    ]);

    const query = goalService.getQueryParams({ startDate });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].title).toBe("Goal 1");
  });

  it("should filter goals by endDate", async () => {
    const endDate = new Date().getTime();

    await Goal.create([
      { title: "Goal 1", endDate },
      {
        title: "Goal 2",
        endDate: new Date(endDate + 86400000),
      }, // Yesterday
    ]);

    const query = goalService.getQueryParams({ endDate });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].title).toBe("Goal 1");
  });

  it("should filter goals by startDate and endDate", async () => {
    const startDate = new Date().getTime();

    const endDate = new Date().getTime();

    await Goal.create([
      { title: "Goal 1", startDate, endDate },
      {
        title: "Goal 2",
        startDate: new Date(startDate - 86400000), // Yesterday
        endDate: new Date(endDate - 86400000), // Yesterday
      },
    ]);

    const query = goalService.getQueryParams({ startDate, endDate });

    const result = await goalRepository.getGoals(query, 0, 10);

    expect(result.goals.length).toBe(1);
    expect(result.goals[0].title).toBe("Goal 1");
  });
});
