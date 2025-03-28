const GoalService = require("../goal.service");
const Goal = require("../goal.model");
const GoalRepository = require("../goal.repository");
const goalController = require("../goal.controller");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
  createGoalValidation,
  getGoalValidation,
} = require("../goal.validation");
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
  "/iperformance-temp/goals",
  createGoalValidation,
  validate,
  goalController.createGoal
);
app.get("/iperformance-temp/goals", goalController.getGoals);
app.patch("/iperformance-temp/goals/:id", goalController.updateGoal);
app.get("/iperformance-temp/goals/:id", goalController.getGoal);
app.delete("/iperformance-temp/goals", goalController.deleteGoal);

const goalService = new GoalService(new GoalRepository());

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
  await Goal.deleteMany(); // Clear database after each test
});

describe("Goal Integration Test - createGoal", () => {
  it("should create a goal successfully", async () => {
    const res = await request(app)
      .post("/iperformance-temp/goals")
      .send({
        title: "Goal 1",
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(201);
    expect(res.body.goal).toHaveProperty("_id");
    expect(res.body.goal.title).toBe("Goal 1");

    const goalInDb = await goalService.getGoalById(res.body.goal._id);
    expect(goalInDb).not.toBeNull();
  });

  it("should return 404 if url is incorrect", async () => {
    const response = await request(app)
      .post("/iperformance-tem/goals")
      .send({
        title: "Goal 1",
        status: "Not started",
      })
      .set("Authorization", "Bearer fake_token");

    // Assert
    expect(response.status).toBe(404);
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/iperformance-temp/goals")
      .send({}) // Missing title
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 400 if invalid data is provided", async () => {
    const res = await request(app)
      .post("/iperformance-temp/goals")
      .send({
        title: "Goal one",
        status: "Unknown",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
  });

  it("should return 409 if a duplicate goal is created", async () => {
    await goalService.createGoal({
      title: "Goal 1",
      status: "In progress",
    });

    const res = await request(app)
      .post("/iperformance-temp/goals")
      .send({
        title: "Goal 1", // Duplicate title
        status: "In progress",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/duplicate key error collection/i);
  });
});

describe("Goal Integration Test - updateGoal", () => {
  it("should update a goal successfully", async () => {
    const goal = await goalService.createGoal({
      title: "Goal 1",
      criticality: "High",
      status: "In progress",
    });

    const url = `/iperformance-temp/goals/${goal._id.toString()}`;
    const res = await request(app)
      .patch(url)
      .send({
        status: "Completed",
      })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.updatedGoal).toHaveProperty("_id");
    expect(res.body.updatedGoal.status).toBe("Completed");
  });

  it("should return 404 if the goal does not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .patch(`/iperformance-temp/goals/${nonExistingId}`)
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Goal not found");
  });

  it("should return 400 if the ID is invalid", async () => {
    const res = await request(app)
      .patch("/iperformance-temp/goals/invalid-id")
      .send({ status: "Completed" })
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed/i);
  });

  it("should return 400 if update data is invalid", async () => {
    const goal = await goalService.createGoal({
      title: "Goal 1",
      status: "In progress",
    });

    const res = await request(app)
      .patch(`/iperformance-temp/goals/${goal._id}`)
      .send({ status: "Extreme" }) // ❌ Not in enum
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Validation failed:.*status/i);
  });
});

describe("Goal Integration Test - deleteGoal", () => {
  it("should delete a goal successfully", async () => {
    const goal1 = await goalService.createGoal({
      title: "Goal 1",
      status: "In progress",
    });
    const goal2 = await goalService.createGoal({
      title: "Goal 2",
      status: "In progress",
    });

    const res = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .set("auth", { userId: "123" })
      .send({ ids: [goal1._id.toString(), goal2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ids");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("deletedCount");
    expect(res.body.deletedCount).toBe(2);
  });

  it("should return 404 if the provided goal IDs do not exist", async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [nonExistingId.toString()] });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No goals found for the provided IDs");
  });

  it("should return 400 if no IDs are provided in the request body", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: [] }); // Empty array

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No goal IDs provided for bulk delete");
  });

  it("should return 400 if any goal ID is invalid", async () => {
    const res = await request(app)
      .delete("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token")
      .send({ ids: ["invalid-id"] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /i);
  });
});

describe("Goal Integration Test - getGoals", () => {
  beforeEach(async () => {
    await goalService.createGoal({
      title: "Goal 1",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      category: "67c06be549d260f9aeb86c7e",
    });

    await goalService.createGoal({
      title: "Goal 2",
      status: "Not started",
      createdAt: 1743772800000,
      startDate: 1743772800000,
      endDate: 1743859200000,
      category: "67c06be549d260f9aeb86c7f",
    });
  });
  it("should get all the goals successfully", async () => {
    const res = await request(app)
      .get("/iperformance-temp/goals")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.goals)).toBe(true);
    expect(res.body.goals).toHaveLength(2);
  });

  it("should filter goals based on search query", async () => {
    const res = await request(app)
      .get("/iperformance-temp/goals?search=Goal 1")
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.goals).toHaveLength(1);
    expect(res.body.goals[0].title).toBe("Goal 1");
  });

  it("should filter goals by categories", async () => {
    const res = await request(app)
      .get(
        "/iperformance-temp/goals?categories=%5B%2267c06be549d260f9aeb86c7e%22%5D"
      ) // categories=["67c06be549d260f9aeb86c7e"]
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.goals).toHaveLength(1);
    expect(res.body.goals[0].category).toBe("67c06be549d260f9aeb86c7e");
  });

  it("should handle invalid category query param", async () => {
    const res = await request(app)
      .get('/iperformance-temp/goals?categories="invalid_json"')
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/categoryIds filters must be an array/);
  });

  //   it("should handle invalid non mongodb id category query param", async () => {
  //     const res = await request(app)
  //       .get("/iperformance-temp/goals?categories=%5B%22invalid_jsone%22%5D")
  //       .set("Authorization", "Bearer fake_token");

  //     expect(res.status).toBe(400);
  //   });
});

describe("Goal Integration Test - getGoal", () => {
  let goal1;
  let goal2;
  beforeEach(async () => {
    goal1 = await goalService.createGoal({
      title: "Goal 1",
      criticality: "High",
      status: "In progress",
      createdAt: 1743427200000,
      startDate: 1743427200000,
      endDate: 1743513600000,
      taskId: "67c06be549d260f9aeb86c7e",
      createdBy: "67c06be549d260f9aeb86c7d",
      reportedBy: "67c06be549d260f9aeb86c7d",
    });

    goal2 = await goalService.createGoal({
      title: "Goal 2",
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

  it("should get the correct goal based on the ID specified", async () => {
    const res = await request(app)
      .get(`/iperformance-temp/goals/${goal1._id}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(200);
    expect(res.body.goal).toBeDefined();
    expect(res.body.goal._id).toBe(goal1._id.toString());
    expect(res.body.goal.title).toBe(goal1.title);
  });

  it("should return 404 if the goal ID does not exist", async () => {
    const nonExistentId = "67c06be549d260f9aeb86c7a";

    const res = await request(app)
      .get(`/iperformance-temp/goals/${nonExistentId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Goal not found");
  });

  it("should return 400 for an invalid goal ID format", async () => {
    const invalidId = "invalid_id";

    const res = await request(app)
      .get(`/iperformance-temp/goals/${invalidId}`)
      .set("Authorization", "Bearer fake_token");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cast to ObjectId failed /);
  });
});
