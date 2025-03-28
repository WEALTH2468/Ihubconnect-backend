const RiskService = require("../risk.service");
const Risk = require("../risk.model");
const RiskRepository = require("../risk.repository");
const riskController = require("../risk.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createRiskValidation,
  getRiskValidation,
} = require("../risk.validation");

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
  "/iperformance-temp/risks",
  createRiskValidation,
  riskController.createRisk
);
app.get("/iperformance-temp/risks", riskController.getRisks);
app.patch("/iperformance-temp/risks/:id", riskController.updateRisk);
app.get("/iperformance-temp/risks/:id", riskController.getRisk);
app.delete("/iperformance-temp/risks", riskController.deleteRisk);

const riskService = new RiskService(new RiskRepository());

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
  await Risk.deleteMany(); // Clear database after each test
});

describe("Risk Integration Test - createRisk", () => {
  it("should create a risk successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/risks")
      .send({
        title: "Server Downtime",
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.risk).toHaveProperty("_id");
    expect(res.body.risk.title).toBe("Server Downtime");

    const riskInDb = await riskService.getRiskById(res.body.risk._id);
    expect(riskInDb).not.toBeNull();
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/risks")
      .send({}) // Missing title, status
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Path `title` is required/i); // Assuming validation error message
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/risks")
      .send({
        title: "Server Downtime",
        status: "Unknown",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it("should return 409 if a duplicate risk is created", async () => {
    await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
    });

    const res = await request(app)
      .post("/iperformance-temp/risks")
      .send({
        title: "Server Downtime", // Duplicate title
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/duplicate key error collection/i);
  });
});

describe("Risk Integration Test - updateRisk", () => {
  it("should update a risk successfully", async () => {
    const risk = await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
    });

    const url = `/iperformance-temp/risks/${risk._id.toString()}`;
    const res = await request(app)
      .patch(url)
      .send({
        status: "Completed",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.updatedRisk).toHaveProperty("_id");
    expect(res.body.updatedRisk.status).toBe("Completed");
  });

  it("should return 404 if the risk does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/iperformance-temp/risks/${nonExistingId}`)
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Risk not found");
  });

  it("should return 400 if the ID is invalid", async () => {
    const res = await request(app)
      .patch("/iperformance-temp/risks/invalid-id")
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
  });

  it("should return 400 if update data is invalid", async () => {
    const risk = await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
    });

    const res = await request(app)
      .patch(`/iperformance-temp/risks/${risk._id}`)
      .send({ criticality: "Extreme" }) // ❌ Not in enum
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed:.*criticality/i);
  });
});

describe("Risk Integration Test - deleteRisk", () => {
  it("should delete a risk successfully", async () => {
    const risk1 = await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
    });
    const risk2 = await riskService.createRisk({
      title: "Server Crash",
      criticality: "High",
      status: "In progress",
    });

    const res = await request(app)
      .delete("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: [risk1._id.toString(), risk2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ids");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("deletedCount");
    expect(res.body.deletedCount).toBe(2);
  });

  it("should return 400 if no IDs are provided in the request body", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [] }); // Empty array

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No risk IDs provided for bulk delete");
  });

  it("should return 400 if any risk ID is invalid", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: ["invalid-id"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /i);
  });
});

describe("Risk Integration Test - getRisks", () => {
  beforeEach(async () => {
    await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      taskId: "67c06be549d260f9aeb86c7e",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });

    await riskService.createRisk({
      title: "Server Crash",
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
  it("should get all the risks successfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/risks")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.risks)).toBe(true);
    expect(res.body.risks).toHaveLength(2);
  });

  it("should filter risks based on search query", async () => {
    const res = await request(app)
      .get("/iperformance-temp/risks?search=Downtime")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.risks).toHaveLength(1);
    expect(res.body.risks[0].title).toBe("Server Downtime");
  });

  it("should filter risks by tasks", async () => {
    const res = await request(app)
      .get(
        "/iperformance-temp/risks?tasks=%5B%2267c06be549d260f9aeb86c7e%22%5D"
      ) // tasks=["67c06be549d260f9aeb86c7e"]
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.risks).toHaveLength(1);
    expect(res.body.risks[0].taskId).toBe("67c06be549d260f9aeb86c7e");
  });

  it("should handle invalid tasks query param", async () => {
    const res = await request(app)
      .get('/iperformance-temp/risks?tasks="invalid_json"')
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Task filters must be an array/);
  });

  it("should handle invalid non mongodb id tasks query param", async () => {
    const res = await request(app)
      .get("/iperformance-temp/risks?tasks=%5B%22invalid_jsone%22%5D")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });
});

describe("Risk Integration Test - getRisk", () => {
  let risk1;
  let risk2;
  beforeEach(async () => {
    risk1 = await riskService.createRisk({
      title: "Server Downtime",
      criticality: "High",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      taskId: "67c06be549d260f9aeb86c7e",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });

    risk2 = await riskService.createRisk({
      title: "Server Crash",
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

  it("should get the correct risk based on the ID specified", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/risks/${risk1._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.risk).toBeDefined();
    expect(res.body.risk._id).toBe(risk1._id.toString());
    expect(res.body.risk.title).toBe(risk1.title);
  });

  it("should return 404 if the risk ID does not exist", async () => {
    const nonExistentId = "67c06be549d260f9aeb86c7a";

    const res = await request(app)
      .get(`/iperformance-temp/risks/${nonExistentId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Risk not found");
  });

  it("should return 400 for an invalid risk ID format", async () => {
    const invalidId = "invalid_id";

    const res = await request(app)
      .get(`/iperformance-temp/risks/${invalidId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /);
  });
});
