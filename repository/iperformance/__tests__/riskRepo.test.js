const mongoose = require("mongoose");
const Risk = require("../../../models/iperformance/risk");
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getRiskSummary } = require("../riskRepo");

beforeAll(async () => {
  await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
  await mongoose.connection.collection("risk").deleteMany({});
});

describe("Risk Repository - Get Risk", () => {
  it("should get correct risk with mixed statuses", async () => {
    const risks = [
      { title: "Risk 1", status: "Completed" },
      { title: "Risk 2", status: "Not started" },
      { title: "Risk 3", status: "In progress" },
      { title: "Risk 4", status: "Completed" },
    ];
    await Risk.insertMany(risks);

    const summary = await getRiskSummary();

    expect(summary).toEqual({
      totalRisks: 4,
      completedRisks: 2,
    });
  });

  it("should handle empty risk list", async () => {
    await Risk.deleteMany({}); // Ensure the database is empty

    const summary = await getRiskSummary();

    expect(summary).toEqual({
      totalRisks: 0,
      completedRisks: 0,
    });
  });

  it("should return zero completed risks if none are completed", async () => {
    const risks = [
      { title: "Risk 1", status: "Not started" },
      { title: "Risk 2", status: "In progress" },
    ];
    await Risk.insertMany(risks);

    const summary = await getRiskSummary();

    expect(summary).toEqual({
      totalRisks: 2,
      completedRisks: 0,
    });
  });
});
