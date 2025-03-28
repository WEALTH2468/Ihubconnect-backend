jest.mock("../challenge.service", () => {
  const mockChallengeService = {
    createChallenge: jest.fn(),
    getChallenges: jest.fn(),
    getChallengeById: jest.fn(),
    updateChallenge: jest.fn(),
    deleteChallenge: jest.fn(),
  };

  return jest.fn().mockImplementation(() => mockChallengeService);
});

const ChallengeService = require("../challenge.service");
const mockChallengeService = new ChallengeService();

const mockChallenge = {
  id: 1,
  title: "Test Challenge",
};
mockChallengeService.createChallenge.mockResolvedValue(mockChallenge);

const request = require("supertest");
const express = require("express");
const challengeController = require("../challenge.controller");

const app = express();
app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: "123" }; // Mocking authenticated user
  next();
});

app.post("/iperformance-temp/challenges", challengeController.createChallenge);
app.get("/iperformance-temp/challenges", challengeController.getChallenges);
app.patch(
  "/iperformance-temp/challenges/:id",
  challengeController.updateChallenge
);
app.get("/iperformance-temp/challenges/:id", challengeController.getChallenge);
app.delete(
  "/iperformance-temp/challenges",
  challengeController.deleteChallenge
);

describe("Challenge Controller - createChallenge", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock calls before each test
  });

  it("should create a challenge successfully and return 201", async () => {
    mockChallengeService.createChallenge.mockResolvedValue(mockChallenge);
    const response = await request(app)
      .post("/iperformance-temp/challenges")
      .send(mockChallenge)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty(
      "message",
      "Challenge created successfully"
    );
    expect(response.body.challenge).toEqual(mockChallenge);
  });

  it("should return 500 if challenge creation fails", async () => {
    // Arrange: Simulate failure
    mockChallengeService.createChallenge.mockRejectedValue(
      new Error("Database error")
    );

    // Act
    const response = await request(app)
      .post("/iperformance-temp/challenges")
      .send(mockChallenge)
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Challenge Controller - getChallenges", () => {
  it("should return 200 and challenges", async () => {
    const mockChallenges = [
      { id: 1, title: "Challenge 1" },
      { id: 2, title: "Challenge 2" },
    ];
    mockChallengeService.getChallenges.mockResolvedValue({
      challenges: mockChallenges,
    });

    const response = await request(app)
      .get("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token");

    expect(response.status).toBe(200);
    expect(response.body.challenges).toEqual(mockChallenges);
  });
});

describe("Challenge Controller - getChallenge", () => {
  it("should return 200 and challenge", async () => {
    const mockChallenge = { id: "67c56971eb95f550cee1fe35", title: "Task 1" };

    mockChallengeService.getChallengeById.mockResolvedValue(mockChallenge);

    const response = await request(app)
      .get("/iperformance-temp/challenges/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.challenge).toEqual(mockChallenge);
  });

  it("should return 500 if fetching challenge fails", async () => {
    mockChallengeService.getChallengeById.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .get("/iperformance-temp/challenges/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Challenge Controller - updateChallenge", () => {
  it("should return 200 and updated challenge", async () => {
    const mockChallenge = {
      id: "67c56971eb95f550cee1fe35",
      title: "Challenge 1",
    };

    mockChallengeService.updateChallenge.mockResolvedValue(mockChallenge);

    const response = await request(app)
      .patch("/iperformance-temp/challenges/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(200);
    expect(response.body.updatedChallenge).toEqual(mockChallenge);
  });

  it("should return 500 if fetching task fails", async () => {
    mockChallengeService.updateChallenge.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .patch("/iperformance-temp/challenges/67c56971eb95f550cee1fe35")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});

describe("Challenge Controller - deleteChallenge", () => {
  it("should return 200 and deleted ids", async () => {
    const mockResponse = {
      message: "Challenges deleted successfully",
      ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"],
      deletedCount: 2,
    };

    mockChallengeService.deleteChallenge.mockResolvedValue(mockResponse);

    const response = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockResponse);
  });

  it("should return 500 if deleting task ", async () => {
    mockChallengeService.deleteChallenge.mockRejectedValue(
      new Error("Database error")
    );

    const response = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: ["67c56971eb95f550cee1fe35", "67c56971eb95f550cee1fe36"] });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Database error");
  });
});
