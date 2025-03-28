const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Period = require("../period.model");
const PeriodRepository = require("../period.repository");
const PeriodService = require("../period.service");

const periodRepository = new PeriodRepository();
const periodService = new PeriodService(periodRepository);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Period.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("PeriodRepository - getPeriods", () => {
  it("should get periods with pagination", async () => {
    await Period.create([
      { name: "Period 1", status: "Not started" },
      { name: "Period 2", status: "In progress" },
    ]);

    const result = await periodRepository.getPeriods({}, 0, 10);

    expect(result.periods.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
  });
  it("should return empty if no periods exist", async () => {
    const result = await periodRepository.getPeriods({}, 0, 10);

    expect(result.periods.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });
});
