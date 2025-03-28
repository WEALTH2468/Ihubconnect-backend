const PeriodService = require("../period.service");
const Period = require("../period.model");
const PeriodRepository = require("../period.repository");
const periodController = require("../period.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createPeriodValidation,
  getPeriodValidation,
} = require("../period.validation");
const validate = require("../../../../middlewares/validate");

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
  "/iperformance-temp/periods",
  createPeriodValidation,
  validate,
  periodController.createPeriod
);
app.get("/iperformance-temp/periods", periodController.getPeriods);
app.patch("/iperformance-temp/periods/:id", periodController.updatePeriod);
app.get("/iperformance-temp/periods/:id", periodController.getPeriod);
app.delete("/iperformance-temp/periods", periodController.deletePeriod);

const periodService = new PeriodService(new PeriodRepository());

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
  await Period.deleteMany({}); // Clear database after each test
});

describe("Period Integration Test - createPeriod", () => {
  it("should create a period successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/periods")
      .send({
        name: "Period 1",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.period).toHaveProperty("_id");
    expect(res.body.period.name).toBe("Period 1");

    const periodInDb = await periodService.getPeriodById(res.body.period._id);
    expect(periodInDb).not.toBeNull();
  });

  it("should return 404 if url is incorrect", async () => {
    const response = await request(app)
      .post("/iperformance-tem/periods")
      .send({
        title: "Period 1",
        criticality: "High",
        status: "Not started",
      })
      .set("Authorization", "Bearer fake_token");

    // Assert
    expect(response.status).toBe(404);
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/periods")
      .send({}) // Missing name
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/periods")
      .send({
        name: [1],
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 409 if a duplicate period is created", async () => {
    await periodService.createPeriod({
      name: "Period 1",
    });

    const res = await request(app)
      .post("/iperformance-temp/periods")
      .send({
        name: "Period 1", // Duplicate title
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/duplicate key error collection/i);
  });
});

describe("Period Integration Test - updatePeriod", () => {
  it("should update a period successfully", async () => {
    const period = await periodService.createPeriod({
      name: "Period 1",
    });

    const url = `/iperformance-temp/periods/${period._id.toString()}`;
    const res = await request(app)
      .patch(url)
      .send({
        status: "Completed",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.updatedPeriod).toHaveProperty("_id");
    expect(res.body.updatedPeriod.status).toBe("Completed");
  });

  it("should return 404 if the period does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/iperformance-temp/periods/${nonExistingId}`)
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Period not found");
  });

  it("should return 400 if the ID is invalid", async () => {
    const res = await request(app)
      .patch("/iperformance-temp/periods/invalid-id")
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
  });

  it("should return 400 if update data is invalid", async () => {
    const period = await periodService.createPeriod({
      name: "Period 1",
    });

    const res = await request(app)
      .patch(`/iperformance-temp/periods/${period._id}`)
      .send({ status: "Extreme" }) // ❌ Not in enum
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed:.*status/i);
  });
});

describe("Period Integration Test - deletePeriod", () => {
  it("should delete a period successfully", async () => {
    const period1 = await periodService.createPeriod({
      name: "Period 1",
    });
    const period2 = await periodService.createPeriod({
      name: "Period 2",
    });

    const res = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: [period1._id.toString(), period2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ids");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("deletedCount");
    expect(res.body.deletedCount).toBe(2);
  });

  it("should return 404 if the provided period IDs do not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [nonExistingId.toString()] });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No periods found for the provided IDs");
  });

  it("should return 400 if no IDs are provided in the request body", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [] }); // Empty array

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No period IDs provided for bulk delete");
  });

  it("should return 400 if any period ID is invalid", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: ["invalid-id"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /i);
  });
});

describe("Period Integration Test - getPeriods", () => {
  beforeEach(async () => {
    await periodService.createPeriod({
      name: "Period 1",
    });

    await periodService.createPeriod({
      name: "Period 2",
    });
  });
  it("should get all the periods successfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/periods")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.periods)).toBe(true);
    expect(res.body.periods).toHaveLength(2);
  });

  it("should filter periods based on search query", async () => {
    const res = await request(app)
      .get("/iperformance-temp/periods?search=Period 1")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.periods).toHaveLength(1);
    expect(res.body.periods[0].name).toBe("Period 1");
  });
});

describe("Period Integration Test - getPeriod", () => {
  let period1;
  let period2;
  beforeEach(async () => {
    period1 = await periodService.createPeriod({
      name: "Period 1",
    });

    period2 = await periodService.createPeriod({
      name: "Period 2",
    });
  });

  it("should get the correct period based on the ID specified", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/periods/${period1._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.period).toBeDefined();
    expect(res.body.period._id).toBe(period1._id.toString());
    expect(res.body.period.title).toBe(period1.title);
  });

  it("should return 404 if the period ID does not exist", async () => {
    const nonExistentId = "67c06be549d260f9aeb86c7a";

    const res = await request(app)
      .get(`/iperformance-temp/periods/${nonExistentId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Period not found");
  });

  it("should return 400 for an invalid period ID format", async () => {
    const invalidId = "invalid_id";

    const res = await request(app)
      .get(`/iperformance-temp/periods/${invalidId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /);
  });
});
