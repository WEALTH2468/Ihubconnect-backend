const mongoose = require("mongoose");
const GoalService = require("../goal.service");
const GoalRepository = require("../goal.repository");

const mockGoalRepository = new GoalRepository();
mockGoalRepository.createGoal = jest.fn();
mockGoalRepository.getGoals = jest.fn();
mockGoalRepository.getGoalById = jest.fn();
mockGoalRepository.updateGoalById = jest.fn();
mockGoalRepository.deleteGoalByIds = jest.fn();

// Inject the mock repository into GoalService
const goalService = new GoalService(mockGoalRepository);

describe("GoalService - createGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a goal successfully", async () => {
    const mockGoal = {
      title: "Test Goal",
      description: "Test Description",
    };
    mockGoalRepository.createGoal.mockResolvedValue(mockGoal);

    const result = await goalService.createGoal(mockGoal);

    expect(mockGoalRepository.createGoal).toHaveBeenCalledWith(mockGoal);
    expect(result).toEqual(mockGoal);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockGoalRepository.createGoal.mockRejectedValue(new Error(errorMessage));

    await expect(goalService.createGoal(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockGoalRepository.createGoal).toHaveBeenCalledTimes(1);
  });
});

describe("GoalService - getGoals", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get goals successfully", async () => {
    const mockFilters = { count: 1 };
    const mockGoals = [
      { title: "Goal 1", description: "Goal 1 description" },
      { title: "Goal 2", description: "Goal 2 description" },
    ];

    const customGoalService = new GoalService(mockGoalRepository);
    customGoalService.getQueryParams = jest.fn();
    customGoalService.getQueryParams.mockReturnValue({});
    mockGoalRepository.getGoals.mockResolvedValue(mockGoals);

    const result = await customGoalService.getGoals(mockFilters);

    expect(result).toEqual(mockGoals);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customGoalService = new GoalService(mockGoalRepository);
    customGoalService.getQueryParams = jest.fn();
    customGoalService.getQueryParams.mockReturnValue({});
    mockGoalRepository.getGoals.mockRejectedValue(new Error(errorMessage));

    await expect(customGoalService.getGoals(mockFilters)).rejects.toThrow(
      errorMessage
    );
  });
});

describe("GoalService - getGoalById", () => {
  it("should get the return the goal by id", async () => {
    const mockGoal = { id: "1", title: "Test Goal" };

    mockGoalRepository.getGoalById.mockResolvedValue(mockGoal);

    const result = await goalService.getGoalById("1");
    expect(mockGoalRepository.getGoalById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockGoal);
  });

  it("should throw an error when fetching goal by id fails", async () => {
    const errorMessage = "Cannot get goal";
    mockGoalRepository.getGoalById.mockRejectedValue(new Error(errorMessage));
    await expect(goalService.getGoalById("1")).rejects.toThrow(errorMessage);
  });
});

describe("GoalService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = {};

    const result = goalService.getQueryParams(filters);

    expect(result).toEqual(expectedQuery);
  });

  it("should construct a search query correctly", () => {
    const filters = { searchQuery: "test" };

    const expectedQuery = {
      $or: [
        { code: { $regex: "test", $options: "i" } },
        { title: { $regex: "test", $options: "i" } },
      ],
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter by startDate and endDate", () => {
    const filters = { startDate: "1700000000000", endDate: "1800000000000" };
    const expectedQuery = {
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should construct a categories query correctly", () => {
    const filters = {
      categoryIds: ["67c06be549d260f9aeb86c7d", "67c06be549d260f9aeb86c7e"],
    };
    const expectedQuery = {
      category: {
        $in: filters.categoryIds,
      },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should construct a users query correctly", () => {
    const filters = {
      userIds: ["67c06be549d260f9aeb86c7d", "67c06be549d260f9aeb86c7e"],
    };
    const expectedQuery = {
      collaborators: {
        $in: filters.userIds,
      },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should construct a teams query correctly", () => {
    const filters = {
      teamIds: ["67c06be549d260f9aeb86c7d", "67c06be549d260f9aeb86c7e"],
    };
    const expectedQuery = {
      teams: {
        $in: filters.teamIds,
      },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by multiple statuses", () => {
    const filters = { statuses: [false, true, false, true] };
    const expectedQuery = {
      status: { $in: ["In review", "Not started"] },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by multiple statuses", () => {
    const filters = { statuses: [true, false, true, false] };
    const expectedQuery = {
      status: { $in: ["Completed", "In progress"] },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due today", () => {
    const filters = { due: "Due today" };
    const startOfDay = new Date().setHours(0, 0, 0, 1);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const expectedQuery = {
      endDate: { $gte: startOfDay, $lte: endOfDay },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due this week", () => {
    const filters = { due: "Due this week" };
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const expectedQuery = {
      endDate: { $gte: startOfWeek.getTime(), $lte: endOfWeek.getTime() },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due this month", () => {
    const filters = { due: "Due this month" };
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 1);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    );
    endOfMonth.setHours(23, 59, 59, 999);

    const expectedQuery = {
      endDate: { $gte: startOfMonth.getTime(), $lte: endOfMonth.getTime() },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by priority", () => {
    const filters = { priority: "High" };

    const expectedQuery = {
      priority: { $regex: "High", $options: "i" },
    };

    const result = goalService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });
});

describe("GoalService - updateGoal", () => {
  it("should update the goal successfully", async () => {
    const mockGoal = { id: "1", title: "Updated Goal" };
    mockGoalRepository.updateGoalById.mockResolvedValue(mockGoal);

    const result = await goalService.updateGoal("1", mockGoal);
    expect(mockGoalRepository.updateGoalById).toHaveBeenCalledWith(
      "1",
      mockGoal
    );
    expect(result).toEqual(mockGoal);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockGoalRepository.updateGoalById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(goalService.updateGoal("1", {})).rejects.toThrow(errorMessage);
  });
});

describe("GoalService - deleteGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the goal successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockGoalRepository.deleteGoalByIds.mockResolvedValue(mockResponse);

    const result = await goalService.deleteGoal(mockIds);
    expect(mockGoalRepository.deleteGoalByIds).toHaveBeenCalledWith(mockIds);
    expect(result).toEqual(mockResponse);
  });
});
