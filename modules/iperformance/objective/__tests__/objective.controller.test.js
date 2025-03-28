jest.mock("../objective.service", () => {
  const mockObjectiveService = {
    createObjective: jest.fn(),
    getObjectives: jest.fn(),
    getObjectiveById: jest.fn(),
    updateObjective: jest.fn(),
    deleteObjective: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockObjectiveService);
});

const ObjectiveService = require("../objective.service");
const mockObjectiveService = new ObjectiveService();

const mockObjective = {
  id: 1,
  title: "Test Objective",
};
mockObjectiveService.createObjective.mockResolvedValue(mockObjective);

const request = require("supertest");
const express = require("express");
const objectiveController = require("../objective.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});

app.post("/iperformance-temp/objectives", objectiveController.createObjective);
app.get("/iperformance-temp/objectives", objectiveController.getObjectives);
app.patch(
  "/iperformance-temp/objectives/:id",
  objectiveController.updateObjective
);
app.get("/iperformance-temp/objectives/:id", objectiveController.getObjective);
app.delete(
  "/iperformance-temp/objectives",
  objectiveController.deleteObjective
);

describe("Objective Controller - createObjective", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a objective successfully and return 201", async () => {
    mockObjectiveService.createObjective.mockResolvedValue(mockObjective);
    const response = await request(app)
      .post("/iperformance-temp/objectives")
      .send(mockObjective)
      .set("Authorization", "Bearer fake_token");

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Objective created successfully"
    );
    expect(response.body.objective).toEqual(mockObjective);
  });

  it("should return 500 if objective creation fails", async () => {
    // Arrange: Simulate failure
    mockObjectiveService.createObjective.mockRejectedValue(
      new Error("Database error")
    );

    // Act
    const response = await request(app)
      .post("/iperformance-temp/objectives")
      .send(mockObjective)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Objective Controller - getObjectives", () => {
  it("should return 200 and objectives", async () => {
    const mockObjectives = [
      { id: 1, title: "Objective 1" },
      { id: 2, title: "Objective 2" },
    ];
    mockObjectiveService.getObjectives.mockResolvedValue({
      objectives: mockObjectives,
    });

    const response = await request(app)
      .get("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(200);
    expect(response.body.objectives).toEqual(mockObjectives);
  });

  it("should throw a 500 error if an error occured while getting objectives", async () => {
    mockObjectiveService.getObjectives.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .get("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockObjectiveService.getObjectives.mockRejectedValue({
      name: "CastError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .get("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });

  it("should throw a 400 error if there is a BSONError", async () => {
    mockObjectiveService.getObjectives.mockRejectedValue({
      name: "BSONError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .get("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });
});

describe("Objective Controller - getObjective", () => {
  it("should return 200 and objective", async () => {
    const mockObjective = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockObjectiveService.getObjectiveById.mockResolvedValue(mockObjective);

    const response = await request(app)
      .get("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.objective).toEqual(mockObjective);
  });

  it("should return 500 if fetching objective fails", async () => {
    mockObjectiveService.getObjectiveById.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .get("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockObjectiveService.getObjectiveById.mockRejectedValue({
      name: "CastError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .get("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });

  it("should throw a 400 error if there is a BSONError", async () => {
    mockObjectiveService.getObjectiveById.mockRejectedValue({
      name: "BSONError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .get("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });
});

describe("Objective Controller - updateObjective", () => {
  it("should return 200 and updated objective", async () => {
    const mockObjective = {
      id: "67c56971eb95f550cee1fe35",
      title: "Objective 1",
    };

    mockObjectiveService.updateObjective.mockResolvedValue(mockObjective);

    const response = await request(app)
      .patch("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.updatedObjective).toEqual(mockObjective);
  });

  it("should return 500 if fetching task fails", async () => {
    mockObjectiveService.updateObjective.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .patch("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockObjectiveService.updateObjective.mockRejectedValue({
      name: "CastError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .patch("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });

  it("should throw a 400 error if there is a ValidationError", async () => {
    mockObjectiveService.updateObjective.mockRejectedValue({
      name: "ValidationError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .patch("/iperformance-temp/objectives/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });
});

describe("Objective Controller - deleteObjective", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Objectives deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockObjectiveService.deleteObjective.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockObjectiveService.deleteObjective.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });

  it("should throw a 400 error if there is a CastError", async () => {
    mockObjectiveService.deleteObjective.mockRejectedValue({
      name: "CastError",
      message: "Cast to ObjectId failed",
    });

    const res = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cast to ObjectId failed");
  });
});
