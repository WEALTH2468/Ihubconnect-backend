jest.mock("../risk.service", () => {
  const mockRiskService = {
    createRisk: jest.fn(),
    getRisks: jest.fn(),
    getRiskById: jest.fn(),
    updateRisk: jest.fn(),
    deleteRisk: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockRiskService);
});

const RiskService = require("../risk.service");
const mockRiskService = new RiskService();

const mockRisk = {
  id: 1,
  title: "Test Risk",
};
mockRiskService.createRisk.mockResolvedValue(mockRisk);

const request = require("supertest");
const express = require("express");
const riskController = require("../risk.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});

app.post("/iperformance-temp/risks", riskController.createRisk);
app.get("/iperformance-temp/risks", riskController.getRisks);
app.patch("/iperformance-temp/risks/:id", riskController.updateRisk);
app.get("/iperformance-temp/risks/:id", riskController.getRisk);
app.delete("/iperformance-temp/risks", riskController.deleteRisk);

describe("Risk Controller - createRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a risk successfully and return 201", async () => {
    mockRiskService.createRisk.mockResolvedValue(mockRisk);
    const response = await request(app)
      .post("/iperformance-temp/risks")
      .send(mockRisk)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Risk created successfully"
    );
    expect(response.body.risk).toEqual(mockRisk);
  });

  it("should return 500 if risk creation fails", async () => {
    // Arrange: Simulate failure
    mockRiskService.createRisk.mockRejectedValue(new Error("Database error"));

    // Act
    const response = await request(app)
      .post("/iperformance-temp/risks")
      .send(mockRisk)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Risk Controller - getRisks", () => {
  it("should return 200 and risks", async () => {
    const mockRisks = [
      { id: 1, title: "Risk 1" },
      { id: 2, title: "Risk 2" },
    ];
    mockRiskService.getRisks.mockResolvedValue({ risks: mockRisks });

    const response = await request(app)
      .get("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(200);
    expect(response.body.risks).toEqual(mockRisks);
  });
});

describe("Risk Controller - getRisk", () => {
  it("should return 200 and risk", async () => {
    const mockRisk = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockRiskService.getRiskById.mockResolvedValue(mockRisk);

    const response = await request(app)
      .get("/iperformance-temp/risks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.risk).toEqual(mockRisk);
  });

  it("should return 500 if fetching risk fails", async () => {
    mockRiskService.getRiskById.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .get("/iperformance-temp/risks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Risk Controller - updateRisk", () => {
  it("should return 200 and updated risk", async () => {
    const mockRisk = { id: "67c56971eb95f550cee1fe35", title: "Risk 1" };

    mockRiskService.updateRisk.mockResolvedValue(mockRisk);

    const response = await request(app)
      .patch("/iperformance-temp/risks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.updatedRisk).toEqual(mockRisk);
  });

  it("should return 500 if fetching task fails", async () => {
    mockRiskService.updateRisk.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .patch("/iperformance-temp/risks/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Risk Controller - deleteRisk", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Risks deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockRiskService.deleteRisk.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockRiskService.deleteRisk.mockRejectedValue(new Error("Database error"));

    const response = await request(app)
      .delete("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});
