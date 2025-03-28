jest.mock("../goal.service", () => {
  const mockGoalService = {
    createGoal: jest.fn(),
    getGoals: jest.fn(),
    getGoalById: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockGoalService);
});

const GoalService = require("../goal.service");
const mockGoalService = new GoalService();

const mockGoal = {
  id: 1,
  title: "Test Goal",
};
mockGoalService.createGoal.mockResolvedValue(mockGoal);

const request = require("supertest");
const express = require("express");
const goalController = require("../goal.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});

app.post("/iperformance-temp/goals", goalController.createGoal);
app.get("/iperformance-temp/goals", goalController.getGoals);
app.patch("/iperformance-temp/goals/:id", goalController.updateGoal);
app.get("/iperformance-temp/goals/:id", goalController.getGoal);
app.delete("/iperformance-temp/goals", goalController.deleteGoal);

describe("Goal Controller - createGoal", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a goal successfully and return 201", async () => {
    mockGoalService.createGoal.mockResolvedValue(mockGoal);
    const response = await request(app)
      .post("/iperformance-temp/goals")
      .send(mockGoal)
      .set("Authorization", "Bearer fake_token");

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Goal created successfully"
    );
    expect(response.body.goal).toEqual(mockGoal);
  });

  it("should return 500 if goal creation fails", async () => {
    // Arrange: Simulate failure
    mockGoalService.createGoal.mockRejectedValue(new Error("Database error"));

    // Act
    const response = await request(app)
      .post("/iperformance-temp/goals")
      .send(mockGoal)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Goal Controller - getGoals", () => {
  it("should return 200 and goals", async () => {
    const mockGoals = [
      { id: 1, title: "Goal 1" },
      { id: 2, title: "Goal 2" },
    ];
    mockGoalService.getGoals.mockResolvedValue({
      goals: mockGoals,
    });

    const response = await request(app)
      .get("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(200);
    expect(response.body.goals).toEqual(mockGoals);
  });

  it("should throw a 500 error if an error occured while getting goals", async () => {
    mockGoalService.getGoals.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockGoalService.getGoals.mockRejectedValue({
      name: "CastError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .get("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });

  it("should throw a 400 error if there is a BSONError", async () => {
    mockGoalService.getGoals.mockRejectedValue({
      name: "BSONError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .get("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });
});

describe("Goal Controller - getGoal", () => {
  it("should return 200 and goal", async () => {
    const mockGoal = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockGoalService.getGoalById.mockResolvedValue(mockGoal);

    const response = await request(app)
      .get("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.goal).toEqual(mockGoal);
  });

  it("should return 500 if fetching goal fails", async () => {
    mockGoalService.getGoalById.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockGoalService.getGoalById.mockRejectedValue({
      name: "CastError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .get("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });

  it("should throw a 400 error if there is a BSONError", async () => {
    mockGoalService.getGoalById.mockRejectedValue({
      name: "BSONError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .get("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });
});

describe("Goal Controller - updateGoal", () => {
  it("should return 200 and updated goal", async () => {
    const mockGoal = {
      id: "67c56971eb95f550cee1fe35",
      title: "Goal 1",
    };

    mockGoalService.updateGoal.mockResolvedValue(mockGoal);

    const response = await request(app)
      .patch("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.updatedGoal).toEqual(mockGoal);
  });

  it("should return 500 if fetching task fails", async () => {
    mockGoalService.updateGoal.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .patch("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockGoalService.updateGoal.mockRejectedValue({
      name: "CastError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .patch("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });

  it("should throw a 400 error if there is a ValidationError", async () => {
    mockGoalService.updateGoal.mockRejectedValue({
      name: "ValidationError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .patch("/iperformance-temp/goals/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });
});

describe("Goal Controller - deleteGoal", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Goals deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockGoalService.deleteGoal.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockGoalService.deleteGoal.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockGoalService.deleteGoal.mockRejectedValue({
      name: "CastError",
      message: "Invalid ObjectId",
    });

    const res = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid ObjectId");
  });
});
