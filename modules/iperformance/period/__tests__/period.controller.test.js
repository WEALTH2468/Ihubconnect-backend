jest.mock("../period.service", () => {
  const mockPeriodService = {
    createPeriod: jest.fn(),
    getPeriods: jest.fn(),
    getPeriodById: jest.fn(),
    updatePeriod: jest.fn(),
    deletePeriod: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockPeriodService);
});

const PeriodService = require("../period.service");
const mockPeriodService = new PeriodService();

const mockPeriod = {
  id: 1,
  title: "Test Period",
};
mockPeriodService.createPeriod.mockResolvedValue(mockPeriod);

const request = require("supertest");
const express = require("express");
const periodController = require("../period.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});

app.post("/iperformance-temp/periods", periodController.createPeriod);
app.get("/iperformance-temp/periods", periodController.getPeriods);
app.patch("/iperformance-temp/periods/:id", periodController.updatePeriod);
app.get("/iperformance-temp/periods/:id", periodController.getPeriod);
app.delete("/iperformance-temp/periods", periodController.deletePeriod);

describe("Period Controller - createPeriod", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a period successfully and return 201", async () => {
    mockPeriodService.createPeriod.mockResolvedValue(mockPeriod);
    const response = await request(app)
      .post("/iperformance-temp/periods")
      .send(mockPeriod)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Period created successfully"
    );
    expect(response.body.period).toEqual(mockPeriod);
  });

  it("should return 500 if period creation fails", async () => {
    // Arrange: Simulate failure
    mockPeriodService.createPeriod.mockRejectedValue(
      new Error("Database error")
    );

    // Act
    const response = await request(app)
      .post("/iperformance-temp/periods")
      .send(mockPeriod)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Period Controller - getPeriods", () => {
  it("should return 200 and periods", async () => {
    const mockPeriods = [
      { id: 1, title: "Period 1" },
      { id: 2, title: "Period 2" },
    ];
    mockPeriodService.getPeriods.mockResolvedValue({
      periods: mockPeriods,
    });

    const response = await request(app)
      .get("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(200);
    expect(response.body.periods).toEqual(mockPeriods);
  });
});

describe("Period Controller - getPeriod", () => {
  it("should return 200 and period", async () => {
    const mockPeriod = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockPeriodService.getPeriodById.mockResolvedValue(mockPeriod);

    const response = await request(app)
      .get("/iperformance-temp/periods/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.period).toEqual(mockPeriod);
  });

  it("should return 500 if fetching period fails", async () => {
    mockPeriodService.getPeriodById.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .get("/iperformance-temp/periods/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Period Controller - updatePeriod", () => {
  it("should return 200 and updated period", async () => {
    const mockPeriod = {
      id: "67c56971eb95f550cee1fe35",
      title: "Period 1",
    };

    mockPeriodService.updatePeriod.mockResolvedValue(mockPeriod);

    const response = await request(app)
      .patch("/iperformance-temp/periods/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.updatedPeriod).toEqual(mockPeriod);
  });

  it("should return 500 if fetching task fails", async () => {
    mockPeriodService.updatePeriod.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .patch("/iperformance-temp/periods/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Period Controller - deletePeriod", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Periods deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockPeriodService.deletePeriod.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockPeriodService.deletePeriod.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});
