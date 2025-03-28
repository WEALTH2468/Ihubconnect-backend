const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Challenge = require("../challenge.model");
const ChallengeRepository = require("../challenge.repository");
const ChallengeService = require("../challenge.service");

const challengeRepository = new ChallengeRepository();
const challengeService = new ChallengeService(challengeRepository);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  await Challenge.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("ChallengeRepository - getChallenges", () => {
  it("should get challenges with pagination", async () => {
    await Challenge.create([
      { title: "Challenge 1", status: "Not started" },
      { title: "Challenge 2", status: "In progress" },
    ]);

    const result = await challengeRepository.getChallenges({}, 0, 10);

    expect(result.challenges.length).toBe(2);
    expect(result.meta.totalRowCount).toBe(2);
  });
  it("should return empty if no challenges exist", async () => {
    const result = await challengeRepository.getChallenges({}, 0, 10);

    expect(result.challenges.length).toBe(0);
    expect(result.meta.totalRowCount).toBe(0);
  });

  it("should filter challenges by tasks", async () => {
    const taskIds = ["65c06be549d260f9aeb86c7f", "65c06be549d260f9aeb86c80"];
    await Challenge.create([
      { title: "Challenge 1", taskId: new mongoose.Types.ObjectId(taskIds[0]) },
      { title: "Challenge 2", taskId: new mongoose.Types.ObjectId(taskIds[1]) },
      { title: "Challenge 3", taskId: new mongoose.Types.ObjectId() },
    ]);

    const query = challengeService.getQueryParams({ tasks: taskIds });
    const result = await challengeRepository.getChallenges(query, 0, 10);

    expect(result.challenges.length).toBe(2);
  });
});
