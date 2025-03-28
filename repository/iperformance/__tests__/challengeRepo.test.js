const mongoose = require("mongoose");
const Challenge = require("../../../models/iperformance/challenge");
require("dotenv").config();
const { connect, closeDatabase } = require("../../../lib/testDbUtil");
const { getChallengeSummary } = require("../challengeRepo");

beforeAll(async () => {
  await connect();
});

afterAll(async () => await closeDatabase());

afterEach(async () => {
  await mongoose.connection.collection("challenge").deleteMany({});
});

describe("Challenge Repository - Get Challenge", () => {
  it("should get correct challenge with mixed statuses", async () => {
    const challenges = [
      { title: "Challenge 1", status: "Completed" },
      { title: "Challenge 2", status: "Not started" },
      { title: "Challenge 3", status: "In progress" },
      { title: "Challenge 4", status: "Completed" },
    ];
    await Challenge.insertMany(challenges);

    const summary = await getChallengeSummary();

    expect(summary).toEqual({
      totalChallenges: 4,
      completedChallenges: 2,
    });
  });

  it("should handle empty challenge list", async () => {
    await Challenge.deleteMany({}); // Ensure the database is empty

    const summary = await getChallengeSummary();

    expect(summary).toEqual({
      totalChallenges: 0,
      completedChallenges: 0,
    });
  });

  it("should return zero completed challenges if none are completed", async () => {
    const challenges = [
      { title: "Challenge 1", status: "Not started" },
      { title: "Challenge 2", status: "In progress" },
    ];
    await Challenge.insertMany(challenges);

    const summary = await getChallengeSummary();

    expect(summary).toEqual({
      totalChallenges: 2,
      completedChallenges: 0,
    });
  });
});
