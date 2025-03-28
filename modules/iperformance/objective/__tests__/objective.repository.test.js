const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Objective = require("../objective.model");
const ObjectiveRepository = require("../objective.repository");
const ObjectiveService = require("../objective.service");
const requestContext = require("../../../../request.context");

const objectiveRepository = new ObjectiveRepository();
const objectiveService = new ObjectiveService(objectiveRepository);

let mongoServer;
const id = "67c06be549d260f9aeb86c7d";
companyDomain = "xyz-company";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Objective.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("ObjectiveRepository - getObjectives", () => {
  it("should get objectives with pagination", async () => {
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          status: "Not started",
        });
        await objectiveRepository.create({
          title: "Objective 2",
          status: "In progress",
        });
        result = await objectiveRepository.getObjectives({}, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
    expect(result.objectives[0].companyDomain).toBe("xyz-company");
    expect(result.objectives[0].companyDomain).toBe("xyz-company");

    let result2;

    await new Promise((resolve) => {
      requestContext.run(
        { userId: id, companyDomain: "abc-company" },
        async () => {
          result = await objectiveRepository.getObjectives({}, 0, 10);
          resolve();
        }
      );
    });

    expect(result.objectives.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });
  it("should return empty if no objectives exist", async () => {
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        result = await objectiveRepository.getObjectives({}, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });

  it("should filter objectives by status", async () => {
    let result;
    const query = objectiveService.getQueryParams({
      statuses: [true, false, false, false],
    });

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          status: "Not started",
        });
        await objectiveRepository.create({
          title: "Objective 2",
          status: "Completed",
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].status).toBe("Completed");
  });

  it("should filter objectives by priority", async () => {
    let result;
    const query = objectiveService.getQueryParams({ priority: "High" });

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          priority: "High",
        });
        await objectiveRepository.create({
          title: "Objective 2",
          priority: "Low",
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].priority).toBe("High");
  });

  it("should filter objectives due today", async () => {
    const query = objectiveService.getQueryParams({ due: "Due today" });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);

        await objectiveRepository.create({
          title: "Objective 1",
          endDate: today,
        });
        await objectiveRepository.create({
          title: "Objective 2",
          endDate: new Date(today.getTime() - 86400000),
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].title).toBe("Objective 1");
  });

  it("should filter objectives due this week", async () => {
    const query = objectiveService.getQueryParams({ due: "Due this week" });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 1);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        await objectiveRepository.create({
          title: "Objective 1",
          endDate: new Date(startOfWeek).getTime(),
        });
        await objectiveRepository.create({
          title: "Objective 2",
          endDate: new Date(endOfWeek).getTime(),
        });
        await objectiveRepository.create({
          title: "Objective 3",
          endDate: new Date(endOfWeek.getTime() + 86400000).getTime(),
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
  });

  it("should filter objectives due this month", async () => {
    const query = objectiveService.getQueryParams({ due: "Due this month" });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 1);

        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        endOfMonth.setHours(23, 59, 59, 999);

        await objectiveRepository.create({
          title: "Objective 1",
          endDate: new Date(startOfMonth).getTime(),
        });
        await objectiveRepository.create({
          title: "Objective 2",
          endDate: new Date(endOfMonth).getTime(),
        });
        await objectiveRepository.create({
          title: "Objective 3",
          endDate: new Date(endOfMonth.getTime() + 86400000).getTime(),
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
  });

  it("should filter objectives by teams", async () => {
    const teamIds = ["65c06be549d260f9aeb86c7d", "65c06be549d260f9aeb86c7e"];
    const query = objectiveService.getQueryParams({ teamIds });

    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          teams: [teamIds[0]],
        });
        await objectiveRepository.create({
          title: "Objective 2",
          teams: [teamIds[1]],
        });
        await objectiveRepository.create({
          title: "Objective 3",
          teams: ["otherTeamId"],
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
  });

  it("should filter objectives by goals", async () => {
    const goalIds = ["65c06be549d260f9aeb86c7f", "65c06be549d260f9aeb86c80"];
    const query = objectiveService.getQueryParams({ goals: goalIds });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          goalId: new mongoose.Types.ObjectId(goalIds[0]),
        });
        await objectiveRepository.create({
          title: "Objective 2",
          goalId: new mongoose.Types.ObjectId(goalIds[1]),
        });
        await objectiveRepository.create({
          title: "Objective 3",
          goalId: new mongoose.Types.ObjectId(),
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
  });

  it("should filter objectives by userIds", async () => {
    const userIds = [
      new mongoose.Types.ObjectId("65c06be549d260f9aeb86c81"),
      new mongoose.Types.ObjectId("65c06be549d260f9aeb86c82"),
    ];
    const query = objectiveService.getQueryParams({ userIds });

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          collaborators: [userIds[0]],
        });
        await objectiveRepository.create({
          title: "Objective 2",
          collaborators: [userIds[1]],
        });
        await objectiveRepository.create({
          title: "Objective 3",
          collaborators: ["65c06be549d260f9aeb86c86"],
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(2);
  });

  it("should filter objectives by startDate", async () => {
    const startDate = new Date().getTime();
    const query = objectiveService.getQueryParams({ startDate });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          startDate,
        });
        await objectiveRepository.create({
          title: "Objective 2",
          startDate: new Date(startDate - 86400000).getTime(), // Yesterday
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].title).toBe("Objective 1");
  });

  it("should filter objectives by endDate", async () => {
    const endDate = new Date().getTime();
    const query = objectiveService.getQueryParams({ endDate });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          endDate,
        });
        await objectiveRepository.create({
          title: "Objective 2",
          endDate: new Date(endDate + 86400000), // Yesterday
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].title).toBe("Objective 1");
  });

  it("should filter objectives by startDate and endDate", async () => {
    const startDate = new Date().getTime();
    const endDate = new Date().getTime();

    const query = objectiveService.getQueryParams({ startDate, endDate });
    let result;

    await new Promise((resolve) => {
      requestContext.run({ userId: id, companyDomain }, async () => {
        await objectiveRepository.create({
          title: "Objective 1",
          startDate,
          endDate,
        });
        await objectiveRepository.create({
          title: "Objective 2",
          startDate: new Date(startDate - 86400000), // Yesterday
          endDate: new Date(endDate - 86400000), // Yesterday
        });
        result = await objectiveRepository.getObjectives(query, 0, 10);
        resolve();
      });
    });

    expect(result.objectives.length).toBe(1);
    expect(result.objectives[0].title).toBe("Objective 1");
  });
});
