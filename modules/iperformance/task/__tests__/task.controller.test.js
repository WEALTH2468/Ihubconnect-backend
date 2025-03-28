jest.mock("../task.service", () => {
  const mockTaskService = {
    createTask: jest.fn(),
    createSubtask: jest.fn(),
    getTasks: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    moveTasks: jest.fn(),
    countUserTasks: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockTaskService);
});

const TaskService = require("../task.service");
const mockTaskService = new TaskService();

const mockTask = {
  id: 1,
  title: "Test Task",
  weight: "weight-id",
  owner: ["owner-id"],
  createdAt: new Date().getTime(),
  status: "Not started",
  period: "period-id",
  startDate: new Date().getTime(),
  endDate: new Date().getTime(),
};
mockTaskService.createTask.mockResolvedValue(mockTask);
mockTaskService.createSubtask.mockResolvedValue(mockTask);

const request = require("supertest");
const express = require("express");
const taskController = require("../task.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});
app.patch("/iperformance-temp/tasks/move", taskController.moveTasks);
app.post("/iperformance-temp/tasks", taskController.createTask);
app.post("/iperformance-temp/tasks/subtask", taskController.createSubtask);
app.get("/iperformance-temp/tasks", taskController.getTasks);
app.get("/iperformance-temp/tasks/:id", taskController.getTask);
app.patch("/iperformance-temp/tasks/:id", taskController.updateTask);
app.delete("/iperformance-temp/tasks", taskController.deleteTask);
app.get(
  "/iperformance-temp/tasks/count/user/:id",
  taskController.countUserTasks
);

describe("Task Controller - createTask", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a task successfully and return 201", async () => {
    const response = await request(app)
      .post("/iperformance-temp/tasks")
      .send(mockTask)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Task created successfully"
    );
    expect(response.body.task).toEqual(mockTask);
  });

  it("should return 500 if task creation fails", async () => {
    // Arrange: Simulate failure
    mockTaskService.createTask.mockRejectedValue(new Error("Database error"));

    // Act
    const response = await request(app)
      .post("/iperformance-temp/tasks")
      .send({
        title: "Failing Task",
        weight: "weight-id",
        owner: ["error-owner"],
      })
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Task Controller - createSubtask", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a subtask successfully and return 201", async () => {
    const response = await request(app)
      .post("/iperformance-temp/tasks/subtask")
      .send(mockTask)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Subtask created successfully"
    );
    expect(response.body.subtask).toEqual(mockTask);
  });

  it("should return 500 if subtask creation fails", async () => {
    // Arrange: Simulate failure
    mockTaskService.createSubtask.mockRejectedValue(
      new Error("Database error")
    );

    // Act
    const response = await request(app)
      .post("/iperformance-temp/tasks/subtask")
      .send({
        title: "Failing Task",
        weight: "weight-id",
        owner: ["error-owner"],
      })
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Task Controller - getTasks", () => {
  it("should return 200 and tasks", async () => {
    const mockTasks = [
      { id: 1, title: "Task 1" },
      { id: 2, title: "Task 2" },
    ];
    mockTaskService.getTasks.mockResolvedValue(mockTasks);

    const response = await request(app)
      .get("/iperformance-temp/tasks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockTasks);
  });

  it("should return 500 if fetching tasks fails", async () => {
    mockTaskService.getTasks.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/iperformance-temp/tasks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Task Controller - getTask", () => {
  it("should return 200 and task", async () => {
    const mockTask = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockTaskService.getTaskById.mockResolvedValue(mockTask);

    const response = await request(app)
      .get("/iperformance-temp/tasks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.task).toEqual(mockTask);
  });

  it("should return 500 if fetching task fails", async () => {
    mockTaskService.getTaskById.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/iperformance-temp/tasks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Task Controller - updateTask", () => {
  it("should return 200 and updated task", async () => {
    const mockTask = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockTaskService.updateTask.mockResolvedValue(mockTask);

    const response = await request(app)
      .patch("/iperformance-temp/tasks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.task).toEqual(mockTask);
  });

  it("should return 500 if fetching task fails", async () => {
    mockTaskService.updateTask.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .patch("/iperformance-temp/tasks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Task Controller - deleteTask", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Task deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockTaskService.deleteTask.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/tasks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 200 and deleted ids when ids are sent as query", async () => {
    const mockResponse = {
      message: "Task deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockTaskService.deleteTask.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete(
        '/iperformance-temp/tasks?ids=["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"]'
      )
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockTaskService.deleteTask.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .delete("/iperformance-temp/tasks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

// describe("Task Controller - moveTask", () => {
//   it("should return 200 and moved ids", async () => {
//     const mockResponse = {
//       message: "Task moved successfully",
//       result: {
//         ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
//         errorIds: [],
//       },
//     };

//     mockTaskService.moveTasks.mockResolvedValue(mockResponse);

//     const response = await request(app)
//       .patch("/iperformance-temp/tasks/move")
//       .set("Authorization", "Bearer fake_token")
//       .set("auth", { userId: "123" })
//       .send({
//         ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
//         periodId: "67c56971eb95f550cee1fe37",
//       });

//     expect(response.status).toBe(200);
//     expect(response.body).toEqual(mockResponse);
//   });

//   it("should return 500 if moved task ", async () => {
//     mockTaskService.moveTasks.mockRejectedValue(new Error("Database error"));

//     const response = await request(app)
//       .patch("/iperformance-temp/tasks/move")
//       .set("Authorization", "Bearer fake_token")
//       .set("auth", { userId: "123" });

//     expect(response.status).toBe(500);
//     expect(response.body).toHaveProperty("message", "Database error");
//   });
// });

describe("Task Controller - countUserTasks", () => {
  it("should return 200 and count of user tasks", async () => {
    const mockResponse = 2;

    mockTaskService.countUserTasks.mockResolvedValue(mockResponse);

    const response = await request(app)
      .get("/iperformance-temp/tasks/count/user/67c56971eb95f550cee1fe36")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.count).toEqual(mockResponse);
  });

  it("should return 500 if moved task ", async () => {
    mockTaskService.countUserTasks.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .get("/iperformance-temp/tasks/count/user/67c56971eb95f550cee1fe36")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});
