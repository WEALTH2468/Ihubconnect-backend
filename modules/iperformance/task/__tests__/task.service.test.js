const mongoose = require("mongoose");
const TaskService = require("../task.service");
const TaskRepository = require("../task.repository");

const mockTaskRepository = new TaskRepository();
mockTaskRepository.createTask = jest.fn();
mockTaskRepository.createSubtask = jest.fn();
mockTaskRepository.getTasks = jest.fn();
mockTaskRepository.updateTask = jest.fn();
mockTaskRepository.getTaskById = jest.fn();
mockTaskRepository.updateTaskById = jest.fn();
mockTaskRepository.deleteTaskByIds = jest.fn();
mockTaskRepository.moveTasks = jest.fn();
mockTaskRepository.countUserTasks = jest.fn();

// Inject the mock repository into TaskService
const taskService = new TaskService(mockTaskRepository);

describe("TaskService - createTask", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a task successfully", async () => {
    const mockTask = { title: "Test Task", description: "Test Description" };
    mockTaskRepository.createTask.mockResolvedValue(mockTask);

    const result = await taskService.createTask(mockTask);

    expect(mockTaskRepository.createTask).toHaveBeenCalledWith(mockTask);
    expect(result).toEqual(mockTask);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockTaskRepository.createTask.mockRejectedValue(new Error(errorMessage));

    await expect(taskService.createTask(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);
  });
});

describe("TaskService - createSubtask", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a subtask", async () => {
    const parentTaskId = "parent-task-id";
    const parentTask = {
      _id: parentTaskId,
      title: "Parent Task",
      subtasks: [],
      status: "In Progress",
      progress: 40,
    };

    const mockSubtask = {
      _id: "subtask-id",
      title: "Test Subtask",
      description: "Subtask details",
    };

    mockTaskRepository.createSubtask.mockResolvedValue(mockSubtask);

    const result = await taskService.createSubtask(mockSubtask, {
      parentId: parentTaskId,
      parentStatus: parentTask.status,
      progress: parentTask.progress,
    });

    expect(mockTaskRepository.createSubtask).toHaveBeenCalledWith(mockSubtask, {
      parentId: parentTaskId,
      parentStatus: parentTask.status,
      progress: parentTask.progress,
    });

    expect(result).toEqual(mockSubtask);
  });
  it("should throw an error when subtask creation fails", async () => {
    const mockSubtask = { title: "Invalid Subtask" };
    const parentTask = { _id: "parent-task-id" };
    const errorMessage = "Subtask creation failed";

    mockTaskRepository.createSubtask.mockRejectedValue(new Error(errorMessage));

    await expect(
      taskService.createSubtask(mockSubtask, parentTask)
    ).rejects.toThrow(errorMessage);
    expect(mockTaskRepository.createSubtask).toHaveBeenCalledWith(
      mockSubtask,
      parentTask
    );
  });
});

describe("TaskService - getTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get tasks successfully", async () => {
    const mockFilters = { count: 1 };
    const mockTasks = [
      { title: "Task 1", description: "Task 1 description" },
      { title: "Task 2", description: "Task 2 description" },
    ];

    const customTaskService = new TaskService(mockTaskRepository);
    customTaskService.getQueryParams = jest.fn();
    customTaskService.getQueryParams.mockReturnValue({});
    mockTaskRepository.getTasks.mockResolvedValue(mockTasks);

    const result = await customTaskService.getTasks(mockFilters);

    expect(result).toEqual(mockTasks);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customTaskService = new TaskService(mockTaskRepository);
    customTaskService.getQueryParams = jest.fn();
    customTaskService.getQueryParams.mockReturnValue({});
    mockTaskRepository.getTasks.mockRejectedValue(new Error(errorMessage));

    await expect(customTaskService.getTasks(mockFilters)).rejects.toThrow(
      errorMessage
    );
  });
});

describe("TaskService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = { isSubtask: false, archived: false, period: null };

    const result = taskService.getQueryParams(filters);

    expect(result).toEqual(expectedQuery);
  });

  it("should construct a search query correctly", () => {
    const filters = { searchQuery: "test" };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      $or: [
        { code: { $regex: "test", $options: "i" } },
        { title: { $regex: "test", $options: "i" } },
      ],
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due today", () => {
    const filters = { due: "Due today" };
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };

    const expectedQuery = {
      ...defaultQuery,
      endDate: { $gte: startOfDay, $lte: endOfDay },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due this week", () => {
    const filters = { due: "Due this week" };
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };

    const expectedQuery = {
      ...defaultQuery,
      endDate: { $gte: startOfWeek, $lte: endOfWeek },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks due this month", () => {
    const filters = { due: "Due this month" };
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(
      startOfMonth.getFullYear(),
      startOfMonth.getMonth() + 1,
      0
    );
    endOfMonth.setHours(23, 59, 59, 999);

    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };

    const expectedQuery = {
      ...defaultQuery,
      endDate: { $gte: startOfMonth, $lte: endOfMonth },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by weight", () => {
    const filters = {
      weights: ["67c06be549d260f9aeb86c2c", "67c06be549d260f9aeb86c2d"],
    };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      weight: {
        $in: filters.weights.map(
          (weightId) => new mongoose.Types.ObjectId(weightId)
        ),
      },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by priority", () => {
    const filters = { priority: "High" };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };

    const expectedQuery = {
      ...defaultQuery,
      priority: { $regex: "High", $options: "i" },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by goals", () => {
    const filters = {
      goals: ["67c06be549d260f9aeb86c2c", "67c06be549d260f9aeb86c2d"],
    };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      goalId: {
        $in: filters.goals.map((goalId) => new mongoose.Types.ObjectId(goalId)),
      },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by objectives", () => {
    const filters = {
      objectives: ["67c06be549d260f9aeb86c2c", "67c06be549d260f9aeb86c2d"],
    };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      objectiveId: {
        $in: filters.objectives.map(
          (objectiveId) => new mongoose.Types.ObjectId(objectiveId)
        ),
      },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by owner", () => {
    const filters = {
      userIds: ["67c06be549d260f9aeb86c2c", "67c06be549d260f9aeb86c2d"],
    };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      owner: {
        $in: filters.userIds.map(
          (userId) => new mongoose.Types.ObjectId(userId)
        ),
      },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter tasks by multiple statuses", () => {
    const filters = { statuses: [false, true, false, true] };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      status: { $in: ["In review", "Not started"] },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter by startDate and endDate", () => {
    const filters = { startDate: "1700000000000", endDate: "1800000000000" };
    const defaultQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    const expectedQuery = {
      ...defaultQuery,
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    const result = taskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should correctly set archived flag based on view filter", () => {
    const archivedFilters = { view: "archived" };
    const expectedArchivedQuery = {
      isSubtask: false,
      archived: true,
    };
    expect(taskService.getQueryParams(archivedFilters)).toEqual(
      expectedArchivedQuery
    );

    const nonArchivedFilters = {};
    const expectedNonArchivedQuery = {
      isSubtask: false,
      archived: false,
      period: null,
    };
    expect(taskService.getQueryParams(nonArchivedFilters)).toEqual(
      expectedNonArchivedQuery
    );
  });

  it("should handle period being null or a valid value", () => {
    const nullPeriodFilters = { period: null };
    const expectedNullQuery = {
      isSubtask: false,
      period: null,
      archived: false,
    };
    expect(taskService.getQueryParams(nullPeriodFilters)).toEqual(
      expectedNullQuery
    );

    const periodId = new mongoose.Types.ObjectId("65f456a9bfae63a1cd231234");
    const validPeriodFilters = { period: periodId };
    const expectedValidQuery = {
      isSubtask: false,
      period: periodId,
      archived: false,
    };
    expect(taskService.getQueryParams(validPeriodFilters)).toEqual(
      expectedValidQuery
    );
  });

  it("should correctly combine multiple filters", () => {
    const filters = {
      searchQuery: "urgent",
      priority: "High",
      due: "Due today",
      statuses: [true, false, true, false],
      startDate: "1700000000000",
      endDate: "1800000000000",
    };

    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);

    const expectedQuery = {
      isSubtask: false,
      archived: false,
      period: null,
      $or: [
        { code: { $regex: "urgent", $options: "i" } },
        { title: { $regex: "urgent", $options: "i" } },
      ],
      priority: { $regex: "High", $options: "i" },
      endDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Completed", "In progress"] },
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    expect(taskService.getQueryParams(filters)).toEqual(expectedQuery);
  });
});

describe("TaskService - getTaskById", () => {
  it("should get the return the task by id", async () => {
    const mockTask = { id: "1", title: "Test Task" };

    mockTaskRepository.getTaskById.mockResolvedValue(mockTask);

    const result = await taskService.getTaskById("1");
    expect(mockTaskRepository.getTaskById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockTask);
  });

  it("should throw an error when fetching task by id fails", async () => {
    const errorMessage = "Cannot get task";
    mockTaskRepository.getTaskById.mockRejectedValue(new Error(errorMessage));
    await expect(taskService.getTaskById("1")).rejects.toThrow(errorMessage);
  });
});

describe("TaskService - updateTask", () => {
  it("should update the task successfully", async () => {
    const mockTask = { id: "1", title: "Updated Task" };
    mockTaskRepository.updateTaskById.mockResolvedValue(mockTask);

    const result = await taskService.updateTask("1", mockTask);
    expect(mockTaskRepository.updateTaskById).toHaveBeenCalledWith(
      "1",
      mockTask
    );
    expect(result).toEqual(mockTask);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockTaskRepository.updateTaskById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(taskService.updateTask("1", {})).rejects.toThrow(errorMessage);
  });
});

describe("TaskService - deleteTask", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the task successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockTaskRepository.deleteTaskByIds.mockResolvedValue(mockResponse);

    const result = await taskService.deleteTask(mockIds);
    expect(mockTaskRepository.deleteTaskByIds).toHaveBeenCalledWith(mockIds);
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error when deleting task fails", async () => {
    const mockIds = ["1", "2"];
    const mockError = new Error("Database error");
    mockTaskRepository.deleteTaskByIds.mockRejectedValue(mockError); // Simulate repository failure

    await expect(taskService.deleteTask(mockIds)).rejects.toThrow(
      "Error deleting task: Database error"
    );
    expect(mockTaskRepository.deleteTaskByIds).toHaveBeenCalledWith(mockIds);
  });

  it("should throw an error if no task ID is provided", async () => {
    const mockIds = []; // Empty array

    await expect(taskService.deleteTask(mockIds)).rejects.toThrow(
      "No task IDs provided for bulk delete"
    );
    expect(mockTaskRepository.deleteTaskByIds).not.toHaveBeenCalled(); // Should not call repo method
  });

  it("should throw an error if input is not an array", async () => {
    const invalidInput = null; // Invalid input

    await expect(taskService.deleteTask(invalidInput)).rejects.toThrow(
      "No task IDs provided for bulk delete"
    );
    expect(mockTaskRepository.deleteTaskByIds).not.toHaveBeenCalled();
  });
});

describe("TaskService - moveTasks", () => {
  it("should move tasks successfully", async () => {
    const mockIds = ["1", "2"];
    const periodId = "1";
    const mockResponse = { ids: ["1", "2"], errorIds: ["1", "2"] };
    mockTaskRepository.moveTasks.mockResolvedValue(mockResponse);

    const result = await taskService.moveTasks(mockIds, periodId);
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error if task cannot be moved", async () => {
    const errorMessage = "Cannot move tasks";
    const mockIds = ["1", "2"];
    const periodId = "1";

    mockTaskRepository.moveTasks.mockRejectedValue(new Error(errorMessage));
    await expect(taskService.moveTasks(mockIds, periodId)).rejects.toThrow(
      errorMessage
    );
  });
});

describe("TaskService - countUserTasks", () => {
  it("should count the correct user tasks", async () => {
    const mockIds = ["1"];
    const mockResponse = 1;
    mockTaskRepository.countUserTasks.mockResolvedValue(mockResponse);
    const result = await taskService.countUserTasks(mockIds);
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error if count user fails", async () => {
    const errorMessage = "Cannot count user tasks";
    const mockIds = ["1"];
    mockTaskRepository.moveTasks.mockRejectedValue(new Error(errorMessage));
    await expect(taskService.moveTasks(mockIds)).rejects.toThrow(errorMessage);
  });
});
