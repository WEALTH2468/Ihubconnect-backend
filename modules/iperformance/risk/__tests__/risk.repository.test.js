const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Risk = require("../risk.model");
const RiskRepository = require("../risk.repository");
const RiskService = require("../risk.service");

const riskRepository = new RiskRepository();
const riskService = new RiskService(riskRepository);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Risk.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("RiskRepository - getRisks", () => {
  it("should get risks with pagination", async () => {
    await Risk.create([
      { title: "Risk 1", status: "Not started" },
      { title: "Risk 2", status: "In progress" },
    ]);

    const result = await riskRepository.getRisks({}, 0, 10);

    expect(result.risks.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
  });
  it("should return empty if no risks exist", async () => {
    const result = await riskRepository.getRisks({}, 0, 10);

    expect(result.risks.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });

  it("should filter risks by tasks", async () => {
    const taskIds = ["65c06be549d260f9aeb86c7f", "65c06be549d260f9aeb86c80"];
    await Risk.create([
      { title: "Risk 1", taskId: new mongoose.Types.ObjectId(taskIds[0]) },
      { title: "Risk 2", taskId: new mongoose.Types.ObjectId(taskIds[1]) },
      { title: "Risk 3", taskId: new mongoose.Types.ObjectId() },
    ]);

    const query = riskService.getQueryParams({ tasks: taskIds });
    const result = await riskRepository.getRisks(query, 0, 10);

    expect(result.risks.length).toBe(2);
  });
});
