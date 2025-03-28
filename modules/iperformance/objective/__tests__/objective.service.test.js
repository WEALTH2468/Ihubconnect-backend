const mongoose = require("mongoose");
const ObjectiveService = require("../objective.service");
const ObjectiveRepository = require("../objective.repository");

const mockObjectiveRepository = new ObjectiveRepository();
mockObjectiveRepository.createObjective = jest.fn();
mockObjectiveRepository.getObjectives = jest.fn();
mockObjectiveRepository.getObjectiveById = jest.fn();
mockObjectiveRepository.updateObjectiveById = jest.fn();
mockObjectiveRepository.deleteObjectiveByIds = jest.fn();

// Inject the mock repository into ObjectiveService
const objectiveService = new ObjectiveService(mockObjectiveRepository);

describe("ObjectiveService - createObjective", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a objective successfully", async () => {
    const mockObjective = {
      title: "Test Objective",
      description: "Test Description",
    };
    mockObjectiveRepository.createObjective.mockResolvedValue(mockObjective);

    const result = await objectiveService.createObjective(mockObjective);

    expect(mockObjectiveRepository.createObjective).toHaveBeenCalledWith(
      mockObjective
    );
    expect(result).toEqual(mockObjective);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockObjectiveRepository.createObjective.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(objectiveService.createObjective(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockObjectiveRepository.createObjective).toHaveBeenCalledTimes(1);
  });
});

describe("ObjectiveService - getObjectives", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get objectives successfully", async () => {
    const mockFilters = { count: 1 };
    const mockObjectives = [
      { title: "Objective 1", description: "Objective 1 description" },
      { title: "Objective 2", description: "Objective 2 description" },
    ];

    const customObjectiveService = new ObjectiveService(
      mockObjectiveRepository
    );
    customObjectiveService.getQueryParams = jest.fn();
    customObjectiveService.getQueryParams.mockReturnValue({});
    mockObjectiveRepository.getObjectives.mockResolvedValue(mockObjectives);

    const result = await customObjectiveService.getObjectives(mockFilters);

    expect(result).toEqual(mockObjectives);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customObjectiveService = new ObjectiveService(
      mockObjectiveRepository
    );
    customObjectiveService.getQueryParams = jest.fn();
    customObjectiveService.getQueryParams.mockReturnValue({});
    mockObjectiveRepository.getObjectives.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(
      customObjectiveService.getObjectives(mockFilters)
    ).rejects.toThrow(errorMessage);
  });
});

describe("ObjectiveService - getObjectiveById", () => {
  it("should get the return the objective by id", async () => {
    const mockObjective = { id: "1", title: "Test Objective" };

    mockObjectiveRepository.getObjectiveById.mockResolvedValue(mockObjective);

    const result = await objectiveService.getObjectiveById("1");
    expect(mockObjectiveRepository.getObjectiveById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockObjective);
  });

  it("should throw an error when fetching objective by id fails", async () => {
    const errorMessage = "Cannot get objective";
    mockObjectiveRepository.getObjectiveById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(objectiveService.getObjectiveById("1")).rejects.toThrow(
      errorMessage
    );
  });
});

describe("ObjectiveService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = {};

    const result = objectiveService.getQueryParams(filters);

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

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter by startDate and endDate", () => {
    const filters = { startDate: "1700000000000", endDate: "1800000000000" };
    const expectedQuery = {
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should construct a goals query correctly", () => {
    const filters = {
      goals: ["67c06be549d260f9aeb86c7d", "67c06be549d260f9aeb86c7e"],
    };
    const expectedQuery = {
      goalId: {
        $in: filters.goals.map((goalId) => new mongoose.Types.ObjectId(goalId)),
      },
    };

    const result = objectiveService.getQueryParams(filters);
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

    const result = objectiveService.getQueryParams(filters);
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

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by multiple statuses", () => {
    const filters = { statuses: [false, true, false, true] };
    const expectedQuery = {
      status: { $in: ["In review", "Not started"] },
    };

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by multiple statuses", () => {
    const filters = { statuses: [true, false, true, false] };
    const expectedQuery = {
      status: { $in: ["Completed", "In progress"] },
    };

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due today", () => {
    const filters = { due: "Due today" };
    const startOfDay = new Date().setHours(0, 0, 0, 1);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const expectedQuery = {
      endDate: { $gte: startOfDay, $lte: endOfDay },
    };

    const result = objectiveService.getQueryParams(filters);
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

    const result = objectiveService.getQueryParams(filters);
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

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by priority", () => {
    const filters = { priority: "High" };

    const expectedQuery = {
      priority: { $regex: "High", $options: "i" },
    };

    const result = objectiveService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });
});

describe("ObjectiveService - updateObjective", () => {
  it("should update the objective successfully", async () => {
    const mockObjective = { id: "1", title: "Updated Objective" };
    mockObjectiveRepository.updateObjectiveById.mockResolvedValue(
      mockObjective
    );

    const result = await objectiveService.updateObjective("1", mockObjective);
    expect(mockObjectiveRepository.updateObjectiveById).toHaveBeenCalledWith(
      "1",
      mockObjective
    );
    expect(result).toEqual(mockObjective);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockObjectiveRepository.updateObjectiveById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(objectiveService.updateObjective("1", {})).rejects.toThrow(
      errorMessage
    );
  });
});

describe("ObjectiveService - deleteObjective", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the objective successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockObjectiveRepository.deleteObjectiveByIds.mockResolvedValue(
      mockResponse
    );

    const result = await objectiveService.deleteObjective(mockIds);
    expect(mockObjectiveRepository.deleteObjectiveByIds).toHaveBeenCalledWith(
      mockIds
    );
    expect(result).toEqual(mockResponse);
  });
});
