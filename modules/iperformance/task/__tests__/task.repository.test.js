const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Task = require("../task.model");
const User = require("../../../../models/user");
const TaskRepository = require("../task.repository");
const TaskService = require("../task.service");

const id = "67c06be549d260f9aeb86c7d";
let mongoServer;
const taskRepository = new TaskRepository();

const taskService = new TaskService(taskRepository);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  await Task.deleteMany({});
});

describe("TaskRepository - getTasks", () => {
  it("should get tasks with pagination", async () => {
    await Task.create([
      { title: "Task 1", status: "Not started", userId: id },
      { title: "Task 2", status: "In progress", userId: id },
    ]);

    const result = await taskRepository.getTasks({}, 0, 10);

    expect(result.tasks.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
  });
  it("should return empty if no tasks exist", async () => {
    const result = await taskRepository.getTasks({}, 0, 10);

    expect(result.tasks.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });

  it("should filter tasks by status", async () => {
    await Task.create([
      { title: "Task 1", status: "Not started", userId: id },
      { title: "Task 2", status: "Completed", userId: id },
    ]);

    const query = taskService.getQueryParams({
      statuses: [true, false, false, false],
    });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].status).toBe("Completed");
  });

  it("should filter tasks by priority", async () => {
    await Task.create([
      { title: "Task 1", priority: "High", userId: id },
      { title: "Task 2", priority: "Low", userId: id },
    ]);

    const query = taskService.getQueryParams({ priority: "High" });
    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].priority).toBe("High");
  });

  it("should filter tasks due today", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    await Task.create([
      { title: "Task 1", endDate: today, userId: id },
      {
        title: "Task 2",
        endDate: new Date(today.getTime() - 86400000),
        userId: id,
      }, // Yesterday
    ]);

    const query = taskService.getQueryParams({ due: "Due today" });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].title).toBe("Task 1");
  });

  it("should filter tasks due this week", async () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    await Task.create([
      { title: "Task 1", endDate: new Date(startOfWeek).getTime(), userId: id },
      { title: "Task 2", endDate: new Date(endOfWeek).getTime(), userId: id },
      {
        title: "Task 3",
        endDate: new Date(endOfWeek.getTime() + 86400000).getTime(),
        userId: id,
      }, // Next week
    ]);

    const query = taskService.getQueryParams({ due: "Due this week" });
    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(2);
  });
  it("should filter tasks due this month", async () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 1);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    await Task.create([
      {
        title: "Task 1",
        endDate: new Date(startOfMonth).getTime(),
        userId: id,
      },
      { title: "Task 2", endDate: new Date(endOfMonth).getTime(), userId: id },
      {
        title: "Task 3",
        endDate: new Date(endOfMonth.getTime() + 86400000).getTime(),
        userId: id,
      }, // Next month
    ]);

    const query = taskService.getQueryParams({ due: "Due this month" });
    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(2);
  });

  it("should filter tasks by objectives", async () => {
    const objectiveIds = [
      "65c06be549d260f9aeb86c7d",
      "65c06be549d260f9aeb86c7e",
    ];
    await Task.create([
      { title: "Task 1", objectiveId: objectiveIds[0], userId: id },
      { title: "Task 2", objectiveId: objectiveIds[1], userId: id },
      {
        title: "Task 3",
        objectiveId: new mongoose.Types.ObjectId(),
        userId: id,
      },
    ]);

    const query = taskService.getQueryParams({ objectives: objectiveIds });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(2);
  });

  it("should filter tasks by goals", async () => {
    const goalIds = ["65c06be549d260f9aeb86c7f", "65c06be549d260f9aeb86c80"];
    await Task.create([
      {
        title: "Task 1",
        goalId: new mongoose.Types.ObjectId(goalIds[0]),
        userId: id,
      },
      {
        title: "Task 2",
        goalId: new mongoose.Types.ObjectId(goalIds[1]),
        userId: id,
      },
      { title: "Task 3", goalId: new mongoose.Types.ObjectId(), userId: id },
    ]);

    const query = taskService.getQueryParams({ goals: goalIds });
    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(2);
  });

  it("should filter tasks by userIds", async () => {
    const userIds = ["65c06be549d260f9aeb86c81", "65c06be549d260f9aeb86c82"];
    await Task.create([
      { title: "Task 1", owner: [userIds[0]], userId: id },
      { title: "Task 2", owner: [userIds[1]], userId: id },
      { title: "Task 3", owner: [new mongoose.Types.ObjectId()], userId: id },
    ]);

    const query = taskService.getQueryParams({ userIds });
    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(2);
  });

  it("should filter tasks by startDate", async () => {
    const startDate = new Date().getTime();

    await Task.create([
      { title: "Task 1", startDate, userId: id },
      {
        title: "Task 2",
        startDate: new Date(startDate - 86400000).getTime(),
        userId: id,
      }, // Yesterday
    ]);

    const query = taskService.getQueryParams({ startDate });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].title).toBe("Task 1");
  });

  it("should filter tasks by endDate", async () => {
    const endDate = new Date().getTime();

    await Task.create([
      { title: "Task 1", endDate, userId: id },
      {
        title: "Task 2",
        endDate: new Date(endDate + 86400000),
        userId: id,
      }, // Yesterday
    ]);

    const query = taskService.getQueryParams({ endDate });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].title).toBe("Task 1");
  });

  it("should filter tasks by startDate and endDate", async () => {
    const startDate = new Date().getTime();

    const endDate = new Date().getTime();

    await Task.create([
      { title: "Task 1", startDate, endDate, userId: id },
      {
        title: "Task 2",
        startDate: new Date(startDate - 86400000), // Yesterday
        endDate: new Date(endDate - 86400000), // Yesterday
        userId: id,
      },
    ]);

    const query = taskService.getQueryParams({ startDate, endDate });

    const result = await taskRepository.getTasks(query, 0, 10);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].title).toBe("Task 1");
  });
});

describe("TaskRepository - createSubtask", () => {
  it("should create a subtask and update the parent task in the DB", async () => {
    const parentTask = new Task({
      title: "Parent Task",
      userId: "67c4a5c650dc2f0a6d8bc844",
      subtasks: [],
      progress: 0,
      status: "Not started",
    });
    await parentTask.save();

    const subtask = { title: "Subtask", userId: "67c4a5c650dc2f0a6d8bc844" };

    const savedSubtask = await taskRepository.createSubtask(subtask, {
      parentId: parentTask._id,
      parentStatus: "In progress",
      progress: 50,
    });

    const updatedParentTask = await Task.findById(parentTask._id);

    expect(updatedParentTask.subtasks).toContainEqual(savedSubtask._id);
    expect(updatedParentTask.status).toBe("In progress");
    expect(updatedParentTask.progress).toBe(50);
  });
});

describe("TaskRepository - moveTasks", () => {
  beforeEach(async () => {
    await Task.deleteMany();
  });

  it("should move tasks to a new period and return updated and error IDs", async () => {
    const periodId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const task1 = await Task.create({ title: "Task 1", userId });
    const task2 = await Task.create({ title: "Task 2", userId });
    const invalidId = new mongoose.Types.ObjectId(); // Non-existent task

    const result = await taskRepository.moveTasks(
      [task1._id, task2._id, invalidId],
      periodId
    );

    // Verify updated tasks
    const updatedTasks = await Task.find({
      _id: { $in: [task1._id, task2._id] },
    });
    updatedTasks.forEach((task) => {
      expect(task.period).toEqual(periodId);
    });

    // Verify return structure
    expect(result.ids).toContainEqual(task1._id);
    expect(result.ids).toContainEqual(task2._id);
    expect(result.errorIds).toContainEqual(invalidId);
  });

  it("should return all IDs in errorIds if no valid tasks exist", async () => {
    const periodId = new mongoose.Types.ObjectId();
    const invalidId1 = new mongoose.Types.ObjectId();
    const invalidId2 = new mongoose.Types.ObjectId();

    const result = await taskRepository.moveTasks(
      [invalidId1, invalidId2],
      periodId
    );

    expect(result.ids).toEqual([]);
    expect(result.errorIds).toContainEqual(invalidId1);
    expect(result.errorIds).toContainEqual(invalidId2);
  });

  it("should return empty arrays when called with an empty ID list", async () => {
    const periodId = new mongoose.Types.ObjectId();

    const result = await taskRepository.moveTasks([], periodId);

    expect(result.ids).toEqual([]);
    expect(result.errorIds).toEqual([]);
  });
});

describe("TaskRepository - countUserTasks", () => {
  beforeEach(async () => {
    await Task.deleteMany();
  });

  it("should return the correct count when tasks exist for given user IDs", async () => {
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    await Task.create([
      { title: "User 1 task", userId: userId1, owner: [userId1] },
      { title: "User 2 task", userId: userId2, owner: [userId1] },
      {
        title: "User 1 and 2 task",
        userId: userId2,
        owner: [userId2, userId1],
      },
    ]);

    const result = await taskRepository.countUserTasks([userId1]);

    expect(result).toBe(3);
  });

  it("should return 0 when no tasks exist for the given user IDs", async () => {
    const userId = new mongoose.Types.ObjectId();
    const result = await taskRepository.countUserTasks([userId]);

    expect(result).toBe(0);
  });

  it("should throw an error when called with an empty idArr", async () => {
    await expect(taskRepository.countUserTasks([])).rejects.toThrow(
      "Id is required"
    );
  });

  it("should return 0 when idArr contains only non-existent user IDs", async () => {
    const result = await taskRepository.countUserTasks([
      new mongoose.Types.ObjectId(),
    ]);

    expect(result).toBe(0);
  });
});
