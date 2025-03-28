const ChallengeService = require("../challenge.service");
const Challenge = require("../challenge.model");
const ChallengeRepository = require("../challenge.repository");
const challengeController = require("../challenge.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createChallengeValidation,
  getChallengeValidation,
} = require("../challenge.validation");

// mongo db
let mongoServer;

const request = require("supertest");
const express = require("express");

const app = express();
const id = "67c06be549d260f9aeb86c7d";

app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: id }; // Mocking authenticated user
  next();
});

app.post(
  "/iperformance-temp/challenges",
  createChallengeValidation,
  challengeController.createChallenge
);
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

const challengeService = new ChallengeService(new ChallengeRepository());

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
  await Challenge.deleteMany(); // Clear database after each test
});

describe("Challenge Integration Test - createChallenge", () => {
  it("should create a challenge successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/challenges")
      .send({
        title: "Challenge 1",
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.challenge).toHaveProperty("_id");
    expect(res.body.challenge.title).toBe("Challenge 1");

    const challengeInDb = await challengeService.getChallengeById(
      res.body.challenge._id
    );
    expect(challengeInDb).not.toBeNull();
  });

  it("should return 404 if url is incorrect", async () => {
    const response = await request(app)
      .post("/iperformance-tem/challenges")
      .send({
        title: "Challenge 1",
        criticality: "High",
        status: "Not started",
      })
      .set("Authorization", "Bearer fake_token");

    // Assert
    expect(response.status).toBe(404);
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/challenges")
      .send({}) // Missing title, status
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Path `title` is required/i); // Assuming validation error message
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/challenges")
      .send({
        title: "Challenge 1",
        status: "Unknown",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it("should return 409 if a duplicate challenge is created", async () => {
    await challengeService.createChallenge({
      title: "Challenge 1",
      criticality: "High",
      status: "In progress",
    });

    const res = await request(app)
      .post("/iperformance-temp/challenges")
      .send({
        title: "Challenge 1", // Duplicate title
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/duplicate key error collection/i);
  });
});

describe("Challenge Integration Test - updateChallenge", () => {
  it("should update a challenge successfully", async () => {
    const challenge = await challengeService.createChallenge({
      title: "Challenge 1",
      criticality: "High",
      status: "In progress",
    });

    const url = `/iperformance-temp/challenges/${challenge._id.toString()}`;
    const res = await request(app)
      .patch(url)
      .send({
        status: "Completed",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.updatedChallenge).toHaveProperty("_id");
    expect(res.body.updatedChallenge.status).toBe("Completed");
  });

  it("should return 404 if the challenge does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/iperformance-temp/challenges/${nonExistingId}`)
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Challenge not found");
  });

  it("should return 400 if the ID is invalid", async () => {
    const res = await request(app)
      .patch("/iperformance-temp/challenges/invalid-id")
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
  });

  it("should return 400 if update data is invalid", async () => {
    const challenge = await challengeService.createChallenge({
      title: "Challenge 1",
      status: "In progress",
    });

    const res = await request(app)
      .patch(`/iperformance-temp/challenges/${challenge._id}`)
      .send({ status: "Extreme" }) // ❌ Not in enum
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed:.*status/i);
  });
});

describe("Challenge Integration Test - deleteChallenge", () => {
  it("should delete a challenge successfully", async () => {
    const challenge1 = await challengeService.createChallenge({
      title: "Challenge 1",
      status: "In progress",
    });
    const challenge2 = await challengeService.createChallenge({
      title: "Challenge 2",
      status: "In progress",
    });

    const res = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: [challenge1._id.toString(), challenge2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ids");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("deletedCount");
    expect(res.body.deletedCount).toBe(2);
  });

  it("should return 404 if the provided challenge IDs do not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [nonExistingId.toString()] });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No challenges found for the provided IDs");
  });

  it("should return 400 if no IDs are provided in the request body", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [] }); // Empty array

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No challenge IDs provided for bulk delete");
  });

  it("should return 400 if any challenge ID is invalid", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: ["invalid-id"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /i);
  });
});

describe("Challenge Integration Test - getChallenges", () => {
  beforeEach(async () => {
    await challengeService.createChallenge({
      title: "Challenge 1",
      criticality: "High",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      taskId: "67c06be549d260f9aeb86c7e",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });

    await challengeService.createChallenge({
      title: "Challenge 2",
      criticality: "High",
      status: "Not started",
      createdAt: 1743772800000,
      startDate: 1743772800000,
      endDate: 1743859200000,
      tasksId: "67c06be549d260f9aeb86c7f",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });
  });
  it("should get all the challenges successfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/challenges")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.challenges)).toBe(true);
    expect(res.body.challenges).toHaveLength(2);
  });

  it("should filter challenges based on search query", async () => {
    const res = await request(app)
      .get("/iperformance-temp/challenges?search=Challenge 1")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.challenges).toHaveLength(1);
    expect(res.body.challenges[0].title).toBe("Challenge 1");
  });

  it("should filter challenges by tasks", async () => {
    const res = await request(app)
      .get(
        "/iperformance-temp/challenges?tasks=%5B%2267c06be549d260f9aeb86c7e%22%5D"
      ) // tasks=["67c06be549d260f9aeb86c7e"]
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.challenges).toHaveLength(1);
    expect(res.body.challenges[0].taskId).toBe("67c06be549d260f9aeb86c7e");
  });

  it("should handle invalid tasks query param", async () => {
    const res = await request(app)
      .get('/iperformance-temp/challenges?tasks="invalid_json"')
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Task filters must be an array/);
  });

  it("should handle invalid non mongodb id tasks query param", async () => {
    const res = await request(app)
      .get("/iperformance-temp/challenges?tasks=%5B%22invalid_jsone%22%5D")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });
});

describe("Challenge Integration Test - getChallenge", () => {
  let challenge1;
  let challenge2;
  beforeEach(async () => {
    challenge1 = await challengeService.createChallenge({
      title: "Challenge 1",
      criticality: "High",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      taskId: "67c06be549d260f9aeb86c7e",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });

    challenge2 = await challengeService.createChallenge({
      title: "Challenge 2",
      criticality: "High",
      status: "Not started",
      createdAt: 1743772800000,
      startDate: 1743772800000,
      endDate: 1743859200000,
      tasksId: "67c06be549d260f9aeb86c7f",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });
  });

  it("should get the correct challenge based on the ID specified", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/challenges/${challenge1._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.challenge).toBeDefined();
    expect(res.body.challenge._id).toBe(challenge1._id.toString());
    expect(res.body.challenge.title).toBe(challenge1.title);
  });

  it("should return 404 if the challenge ID does not exist", async () => {
    const nonExistentId = "67c06be549d260f9aeb86c7a";

    const res = await request(app)
      .get(`/iperformance-temp/challenges/${nonExistentId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Challenge not found");
  });

  it("should return 400 for an invalid challenge ID format", async () => {
    const invalidId = "invalid_id";

    const res = await request(app)
      .get(`/iperformance-temp/challenges/${invalidId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /);
  });
});
