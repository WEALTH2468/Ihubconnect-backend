const TaskService = require("../task.service");
const Task = require("../task.model");
const User = require("../../../../models/user");
const Weight = require("../../../../models/weight");
const TaskRepository = require("../task.repository");
const taskController = require("../task.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createTaskValidation,
  getTaskValidation,
  createSubtaskValidation,
} = require("../task.validation");
const validate = require("../../../../middlewares/validate");

// mongo db
let mongoServer;

const request = require("supertest");
const express = require("express");

const app = express();
const id = "67c06be549d260f9aeb86c7d";

const mockTask = {
  title: "Task 1",
  weight: "67c06be549d260f9aeb86c7a",
  owner: ["67c06be549d260f9aeb86c7b"],
  createdAt: new Date().getTime(),
  status: "Not started",
  period: "67c06be549d260f9aeb86c7c",
  startDate: new Date().getTime(),
  endDate: new Date().getTime(),
  userId: "67c06be549d260f9aeb86c7d",
};

app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: id }; // Mocking authenticated user
  next();
});

app.post(
  "/iperformance-temp/tasks",
  createTaskValidation,
  validate,
  taskController.createTask
);
app.post(
  "/iperformance-temp/tasks/subtask",
  createSubtaskValidation,
  validate,
  taskController.createSubtask
);
app.get("/iperformance-temp/tasks", taskController.getTasks);
app.patch("/iperformance-temp/tasks/:id", taskController.updateTask);
app.get("/iperformance-temp/tasks/:id", taskController.getTask);
app.delete("/iperformance-temp/tasks", taskController.deleteTask);

const taskService = new TaskService(new TaskRepository());

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Task.deleteMany({}); // Clear database after each test
});

describe("Task Integration Test - createTask", () => {
  it("should create a task successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/tasks")
      .send(mockTask)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.task).toHaveProperty("_id");
    expect(res.body.task.title).toBe("Task 1");

    const taskInDb = await taskService.getTaskById(res.body.task._id);
    expect(taskInDb).not.toBeNull();
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/tasks")
      .send({}) // Missing title
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/tasks")
      .send({
        title: "Task one",
        status: "Unknown",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 409 if a duplicate task is created", async () => {
    await taskService.createTask(mockTask);

    const res = await request(app)
      .post("/iperformance-temp/tasks")
      .send(mockTask)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/duplicate key error collection/i);
  });
});

describe("Task Integration Test - createSubtask", () => {
  let task;
  beforeEach(async () => {
    task = await taskService.createTask(mockTask);
  });

  it("it should create a subtask sucessfully", async () => {
    const mockSubtask = {
      title: "Subtask 1",
      weight: "67c06be549d260f9aeb86c7a",
      owner: ["67c06be549d260f9aeb86c7b"],
      createdAt: new Date().getTime(),
      status: "In progress",
      period: "67c06be549d260f9aeb86c7c",
      startDate: new Date().getTime(),
      endDate: new Date().getTime(),
      userId: "67c06be549d260f9aeb86c7d",
      parentId: task._id,
      progress: 0,
      parentStatus: "In progress",
    };

    const res = await request(app)
      .post("/iperformance-temp/tasks/subtask")
      .send(mockSubtask)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.subtask).toHaveProperty("_id");
    expect(res.body.subtask.title).toBe("Subtask 1");

    // Verify that the parent task status is updated
    const updatedTask = await taskService.getTaskById(task._id);
    expect(updatedTask.status).toBe("In progress");
  });

  it("it should return a 400 error if required fields are missing", async () => {
    const response = await request(app)
      .post("/iperformance-temp/tasks/subtask")
      .send({}) // Missing required fields
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(400);
  });

  it("it should return 400 error if invalid data is provided", async () => {
    async () => {
      const response = await request(app)
        .post("/iperformance-temp/tasks/subtask")
        .send({
          title: "Subtask 1",
          status: "Unknown Status", // Invalid status
          parentId: task._id,
        })
        .set("Authorization", "Bearer fake_token");

      expect(response.status).toBe(400);
    };
  });

  it("it should return 409 if a duplicate subtask is created", async () => {
    async () => {
      const mockSubtask = {
        title: "Subtask 1",
        weight: "67c06be549d260f9aeb86c7a",
        owner: ["67c06be549d260f9aeb86c7b"],
        createdAt: new Date().getTime(),
        status: "In progress",
        period: "67c06be549d260f9aeb86c7c",
        startDate: new Date().getTime(),
        endDate: new Date().getTime(),
        userId: "67c06be549d260f9aeb86c7d",
        parentId: task._id,
        progress: 0,
        parentStatus: "In progress",
      };

      await taskService.createSubtask(mockSubtask);

      const response = await request(app)
        .post("/iperformance-temp/tasks/subtask")
        .send(mockSubtask)
        .set("Authorization", "Bearer fake_token");

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/duplicate key error collection/i);
    };
  });
});

describe("Task Integration Test - getTasks", () => {
  let taskService;

  beforeEach(async () => {
    taskService = new TaskService(new TaskRepository());
    await request(app)
      .post("/iperformance-temp/tasks")
      .send({
        title: "Task 11",
        weight: "67c06be549d260f9aeb86c7a",
        owner: ["67c06be549d260f9aeb86c7b"],
        createdAt: Date.now(),
        status: "Not started",
        period: null,
        priority: "Urgent",
        startDate: new Date("2025-03-01").getTime(),
        endDate: new Date().getTime(),
      });

    await request(app)
      .post("/iperformance-temp/tasks")
      .send({
        title: "Task 12",
        weight: "67c06be549d260f9aeb86c7e",
        owner: ["67c06be549d260f9aeb86c7f"],
        createdAt: Date.now(),
        status: "In progress",
        priority: "Urgent",
        period: "67c06be549d260f9aeb86c6a",
        startDate: new Date("2025-03-05").getTime(),
        endDate: new Date("2025-03-15").getTime(),
      });

    await request(app)
      .post("/iperformance-temp/tasks")
      .send({
        title: "Task 13",
        weight: "67c06be549d260f9aeb86c6c",
        owner: ["67c06be549d260f9aeb86c6d"],
        createdAt: Date.now(),
        status: "Completed",
        period: null,
        goalId: "67c06be549d260f9aeb86c3c",
        objectiveId: "67c06be549d260f9aeb86c2c",
        startDate: new Date("2025-03-10").getTime(),
        endDate: new Date().getTime(),
      });
  });

  it("should get all backlog tasks sucessfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/tasks")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.meta.totalRowCount).toBe(2);
  });

  it("should get all period tasks sucessfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/tasks?period=67c06be549d260f9aeb86c6a&&count=0")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get tasks based on search query params", async () => {
    const res = await request(app)
      .get("/iperformance-temp/tasks?search=Task 11")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get tasks based on startDate", async () => {
    const startDate = new Date("2025-03-04").getTime();

    const res = await request(app)
      .get(`/iperformance-temp/tasks?startDate=${startDate}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get tasks based on endDate", async () => {
    const endDate = new Date("2025-03-11").getTime();

    const res = await request(app)
      .get(`/iperformance-temp/tasks?endDate=${endDate}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.meta.totalRowCount).toBe(2);
  });

  it("should get tasks based on due today", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?due="Due Today"`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.meta.totalRowCount).toBe(2);
  });

  it("should get tasks based on priority", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?priority=Urgent`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get tasks based on the statuses", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?status=[true, false, false, false]`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get tasks based on weights", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?weights=["67c06be549d260f9aeb86c6c"]`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get the tasks based on goals", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?goals=["67c06be549d260f9aeb86c3c"]`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get the tasks based on objectives", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?objectives=["67c06be549d260f9aeb86c2c"]`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });

  it("should get the task based on userIds", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks?users=["67c06be549d260f9aeb86c7b"]`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.meta.totalRowCount).toBe(1);
  });
});

describe("Task Integration Test - getTask", () => {
  let task;

  beforeEach(async () => {
    task = await taskService.createTask({
      title: "Test Task",
      weight: "67c06be549d260f9aeb86c7a",
      owner: ["67c06be549d260f9aeb86c7b"],
      createdAt: Date.now(),
      status: "In progress",
      period: "67c06be549d260f9aeb86c6a",
      startDate: new Date("2025-03-10").getTime(),
      endDate: new Date("2025-03-15").getTime(),
      userId: "67c06be549d260f9aeb86c7c",
    });
  });

  it("should get the task successfully based on the id", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks/${task._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.task).toHaveProperty("_id", task._id.toString());
    expect(res.body.task.title).toBe("Test Task");
  });

  it("should return 404 if task is not found", async () => {
    const fakeId = "67c06be549d260f9aeb86c99"; // Non-existent ID
    const res = await request(app)
      .get(`/iperformance-temp/tasks/${fakeId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("should return 400 if task ID is invalid", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/tasks/invalid_id`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

describe("Task Integration Test - updateTask", () => {
  let task, subtask;

  beforeEach(async () => {
    // Create a task
    task = await taskService.createTask({
      title: "Initial Task",
      weight: "67c06be549d260f9aeb86c7a",
      owner: ["67c06be549d260f9aeb86c7b"],
      createdAt: Date.now(),
      status: "Not started",
      period: "67c06be549d260f9aeb86c6a",
      startDate: new Date("2025-03-10").getTime(),
      endDate: new Date("2025-03-15").getTime(),
      userId: "67c06be549d260f9aeb86c5a",
    });

    // Create a subtask
    subtask = await taskService.createSubtask(
      {
        title: "Initial Subtask",
        parentId: task._id,
        weight: "67c06be549d260f9aeb86c7a",
        owner: ["67c06be549d260f9aeb86c7b"],
        createdAt: Date.now(),
        status: "Not started",
        period: "67c06be549d260f9aeb86c6a",
        startDate: new Date("2025-03-10").getTime(),
        endDate: new Date("2025-03-15").getTime(),
        userId: "67c06be549d260f9aeb86c5a",
      },
      { parentId: task._id, progress: 20, parentStatus: "Not started" }
    );
  });

  it("should update the task successfully", async () => {
    const updatePayload = {
      title: "Updated Task Title",
      status: "In progress",
    };

    const res = await request(app)
      .patch(`/iperformance-temp/tasks/${task._id}`)
      .send(updatePayload)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.task).toHaveProperty("title", "Updated Task Title");
    expect(res.body.task).toHaveProperty("status", "In progress");

    // Verify the task was actually updated in DB
    const updatedTask = await taskService.getTaskById(task._id);
    expect(updatedTask.title).toBe("Updated Task Title");
    expect(updatedTask.status).toBe("In progress");
  });

  // it("should return 400 if update payload is invalid", async () => {
  //   const res = await request(app)
  //     .patch(`/iperformance-temp/tasks/${task._id}`)
  //     .send({ status: "InvalidStatus" }) // Invalid status
  //     .set("Authorization", "Bearer fake_token");

  //   expect(res.status).toBe(400);
  //   expect(res.body.message).toMatch(/invalid/i);
  // });

  // it("should return 404 if task to update is not found", async () => {
  //   const fakeId = "67c06be549d260f9aeb86c99"; // Non-existent ID
  //   const res = await request(app)
  //     .patch(`/iperformance-temp/tasks/${fakeId}`)
  //     .send({ title: "New Title" })
  //     .set("Authorization", "Bearer fake_token");

  //   expect(res.status).toBe(404);
  //   expect(res.body.message).toMatch(/not found/i);
  // });

  // it("should return 400 if task ID format is invalid", async () => {
  //   const res = await request(app)
  //     .patch(`/iperformance-temp/tasks/invalid_id`)
  //     .send({ title: "New Title" })
  //     .set("Authorization", "Bearer fake_token");

  //   expect(res.status).toBe(400);
  //   expect(res.body.message).toMatch(/invalid/i);
  // });
});

// describe("Task Integration Test - deleteTask", () => {});
