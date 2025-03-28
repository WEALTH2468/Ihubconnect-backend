const ObjectiveService = require("../objective.service");
const Objective = require("../objective.model");
const ObjectiveRepository = require("../objective.repository");
const objectiveController = require("../objective.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createObjectiveValidation,
  getObjectiveValidation,
} = require("../objective.validation");
const validate = require("../../../../middlewares/validate");
const tenantContext = require("../../../../middlewares/tenant-context");

// mongo db
let mongoServer;

const request = require("supertest");
const express = require("express");
const requestContext = require("../../../../request.context");

const app = express();
const id = "67c06be549d260f9aeb86c7d";

app.use(express.json()); // Middleware to parse JSON
app.use((req, res, next) => {
  req.auth = { userId: id }; // Mocking authenticated user
  next();
});

app.use((req, res, next) => {
  if (req.auth) {
    const context = {
      userId: req.auth.userId,
      companyDomain: "xyz-company",
    };
    requestContext.run(context, next);
  } else {
    next();
  }
});

app.post(
  "/iperformance-temp/objectives",
  createObjectiveValidation,
  validate,
  objectiveController.createObjective
);
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

const objectiveService = new ObjectiveService(new ObjectiveRepository());

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
  await Objective.deleteMany(); // Clear database after each test
});

describe("Objective Integration Test - createObjective", () => {
  it("should create a objective successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.objective).toHaveProperty("_id");
    expect(res.body.objective.title).toBe("Objective 1");

    const id = res.body.objective._id;
    const objectiveInDbRes = await request(app)
      .get(`/iperformance-temp/objectives/${id}`)
      .set("Authorization", "Bearer fake_token");

    expect(objectiveInDbRes.body.objective).not.toBeNull();
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/objectives")
      .send({}) // Missing title
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective one",
        status: "Unknown",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 409 if a duplicate objective is created", async () => {
    await objectiveService.createObjective({
      title: "Objective 1",
      status: "In progress",
    });

    const res = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1", // Duplicate title
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Objective already exists/i);
  });
});

describe("Objective Integration Test - updateObjective", () => {
  it("should update a objective successfully", async () => {
    const objectiveRes = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    const url = `/iperformance-temp/objectives/${objectiveRes.body.objective._id.toString()}`;
    const res = await request(app)
      .patch(url)
      .send({
        status: "Completed",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.updatedObjective).toHaveProperty("_id");
    expect(res.body.updatedObjective.status).toBe("Completed");
  });

  it("should return 404 if the objective does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/iperformance-temp/objectives/${nonExistingId}`)
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Objective not found");
  });

  it("should return 400 if the ID is invalid", async () => {
    const res = await request(app)
      .patch("/iperformance-temp/objectives/invalid-id")
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
  });

  it("should return 400 if update data is invalid", async () => {
    const objectiveRes = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        criticality: "High",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    const res = await request(app)
      .patch(`/iperformance-temp/objectives/${objectiveRes.body.objective._id}`)
      .send({ status: "Extreme" }) // ❌ Not in enum
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed:.*status/i);
  });
});

describe("Objective Integration Test - deleteObjective", () => {
  it("should delete a objective successfully", async () => {
    const objectiveRes1 = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    const objectiveRes2 = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 2",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    const res = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({
        ids: [
          objectiveRes1.body.objective._id.toString(),
          objectiveRes2.body.objective._id.toString(),
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ids");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("deletedCount");
    expect(res.body.deletedCount).toBe(2);
  });

  it("should return 404 if the provided objective IDs do not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [nonExistingId.toString()] });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No objectives found for the provided IDs");
  });

  it("should return 400 if no IDs are provided in the request body", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [] }); // Empty array

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No objective IDs provided for bulk delete");
  });

  it("should return 400 if any objective ID is invalid", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: ["invalid-id"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /i);
  });
});

describe("Objective Integration Test - getObjectives", () => {
  beforeEach(async () => {
    await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        criticality: "High",
        status: "In progress",
        createdAt: 1743427200000,
        startDate: 1743427200000,
        endDate: 1743513600000,
        goalId: "67c06be549d260f9aeb86c7e",
      })
      .set("Authorization", "Bearer fake_token");

    await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 2",
        criticality: "High",
        status: "Not started",
        createdAt: 1743772800000,
        startDate: 1743772800000,
        endDate: 1743859200000,
        goalId: "67c06be549d260f9aeb86c7f",
      })
      .set("Authorization", "Bearer fake_token");
  });
  it("should get all the objectives successfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/objectives")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.objectives)).toBe(true);
    expect(res.body.objectives).toHaveLength(2);
  });

  it("should filter objectives based on search query", async () => {
    const res = await request(app)
      .get("/iperformance-temp/objectives?search=Objective 1")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.objectives).toHaveLength(1);
    expect(res.body.objectives[0].title).toBe("Objective 1");
  });

  it("should filter objectives by goals", async () => {
    const res = await request(app)
      .get(
        "/iperformance-temp/objectives?goals=%5B%2267c06be549d260f9aeb86c7e%22%5D"
      ) // tasks=["67c06be549d260f9aeb86c7e"]
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.objectives).toHaveLength(1);
    expect(res.body.objectives[0].goalId).toBe("67c06be549d260f9aeb86c7e");
  });

  it("should handle invalid tasks query param", async () => {
    const res = await request(app)
      .get('/iperformance-temp/objectives?goals="invalid_json"')
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/goals filters must be an array/);
  });

  it("should handle invalid non mongodb id tasks query param", async () => {
    const res = await request(app)
      .get("/iperformance-temp/objectives?goals=%5B%22invalid_jsone%22%5D")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });
});

describe("Objective Integration Test - getObjective", () => {
  let objectiveRes1;
  let objectiveRes2;
  beforeEach(async () => {
    objectiveRes1 = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 1",
        criticality: "High",
        status: "In progress",
        createdAt: 1743427200000,
        startDate: 1743427200000,
        endDate: 1743513600000,
        taskId: "67c06be549d260f9aeb86c7e",
        createdBy: "67c06be549d260f9aeb86c7d",
        reportedBy: "67c06be549d260f9aeb86c7d",
      })
      .set("Authorization", "Bearer fake_token");

    objectiveRes2 = await request(app)
      .post("/iperformance-temp/objectives")
      .send({
        title: "Objective 2",
        criticality: "High",
        status: "Not started",
        createdAt: 1743772800000,
        startDate: 1743772800000,
        endDate: 1743859200000,
        tasksId: "67c06be549d260f9aeb86c7f",
        createdBy: "67c06be549d260f9aeb86c7d",
        reportedBy: "67c06be549d260f9aeb86c7d",
      })
      .set("Authorization", "Bearer fake_token");
  });

  it("should get the correct objective based on the ID specified", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/objectives/${objectiveRes1.body.objective._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.objective).toBeDefined();
    expect(res.body.objective._id).toBe(
      objectiveRes1.body.objective._id.toString()
    );
    expect(res.body.objective.title).toBe(objectiveRes1.body.objective.title);
  });

  it("should return 404 if the objective ID does not exist", async () => {
    const nonExistentId = "67c06be549d260f9aeb86c7a";

    const res = await request(app)
      .get(`/iperformance-temp/objectives/${nonExistentId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Objective not found");
  });

  it("should return 400 for an invalid objective ID format", async () => {
    const invalidId = "invalid_id";

    const res = await request(app)
      .get(`/iperformance-temp/objectives/${invalidId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/);
  });
});
