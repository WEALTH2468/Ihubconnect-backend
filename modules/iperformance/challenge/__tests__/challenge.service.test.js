const mongoose = require("mongoose");
const ChallengeService = require("../challenge.service");
const ChallengeRepository = require("../challenge.repository");

const mockChallengeRepository = new ChallengeRepository();
mockChallengeRepository.createChallenge = jest.fn();
mockChallengeRepository.getChallenges = jest.fn();
mockChallengeRepository.getChallengeById = jest.fn();
mockChallengeRepository.updateChallengeById = jest.fn();
mockChallengeRepository.deleteChallengeById = jest.fn();

// Inject the mock repository into TaskService
const challengeService = new ChallengeService(mockChallengeRepository);

describe("ChallengeService - createChallenge", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a challenge successfully", async () => {
    const mockChallenge = {
      title: "Test Challenge",
      description: "Test Description",
    };
    mockChallengeRepository.createChallenge.mockResolvedValue(mockChallenge);

    const result = await challengeService.createChallenge(mockChallenge);

    expect(mockChallengeRepository.createChallenge).toHaveBeenCalledWith(
      mockChallenge
    );
    expect(result).toEqual(mockChallenge);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockChallengeRepository.createChallenge.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(challengeService.createChallenge(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockChallengeRepository.createChallenge).toHaveBeenCalledTimes(1);
  });
});

describe("ChallengeService - getChallenges", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get challenges successfully", async () => {
    const mockFilters = { count: 1 };
    const mockChallenges = [
      { title: "Challenge 1", description: "Challenge 1 description" },
      { title: "Challenge 2", description: "Challenge 2 description" },
    ];

    const customChallengeService = new ChallengeService(
      mockChallengeRepository
    );
    customChallengeService.getQueryParams = jest.fn();
    customChallengeService.getQueryParams.mockReturnValue({});
    mockChallengeRepository.getChallenges.mockResolvedValue(mockChallenges);

    const result = await customChallengeService.getChallenges(mockFilters);

    expect(result).toEqual(mockChallenges);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customChallengeService = new ChallengeService(
      mockChallengeRepository
    );
    customChallengeService.getQueryParams = jest.fn();
    customChallengeService.getQueryParams.mockReturnValue({});
    mockChallengeRepository.getChallenges.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(
      customChallengeService.getChallenges(mockFilters)
    ).rejects.toThrow(errorMessage);
  });
});

describe("ChallengeService - getChallengeById", () => {
  it("should get the return the challenge by id", async () => {
    const mockChallenge = { id: "1", title: "Test Challenge" };

    mockChallengeRepository.getChallengeById.mockResolvedValue(mockChallenge);

    const result = await challengeService.getChallengeById("1");
    expect(mockChallengeRepository.getChallengeById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockChallenge);
  });

  it("should throw an error when fetching challenge by id fails", async () => {
    const errorMessage = "Cannot get challenge";
    mockChallengeRepository.getChallengeById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(challengeService.getChallengeById("1")).rejects.toThrow(
      errorMessage
    );
  });
});

describe("ChallengeService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = {};

    const result = challengeService.getQueryParams(filters);

    expect(result).toEqual(expectedQuery);
  });

  it("should construct a search query correctly", () => {
    const filters = { searchQuery: "test" };

    const expectedQuery = {
      $or: [
        { code: { $regex: "test", $options: "i" } },
        { title: { $regex: "test", $options: "i" } },
      ],
    };

    const result = challengeService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should construct a tasks query correctly", () => {
    const filters = {
      tasks: ["67c06be549d260f9aeb86c7d", "67c06be549d260f9aeb86c7e"],
    };
    const expectedQuery = {
      taskId: {
        $in: filters.tasks.map((taskId) => new mongoose.Types.ObjectId(taskId)),
      },
    };

    const result = challengeService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter by startDate and endDate", () => {
    const filters = { startDate: "1700000000000", endDate: "1800000000000" };
    const expectedQuery = {
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    const result = challengeService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });
});

describe("ChallengeService - updateChallenge", () => {
  it("should update the challenge successfully", async () => {
    const mockChallenge = { id: "1", title: "Updated Challenge" };
    mockChallengeRepository.updateChallengeById.mockResolvedValue(
      mockChallenge
    );

    const result = await challengeService.updateChallenge("1", mockChallenge);
    expect(mockChallengeRepository.updateChallengeById).toHaveBeenCalledWith(
      "1",
      mockChallenge
    );
    expect(result).toEqual(mockChallenge);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockChallengeRepository.updateChallengeById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(challengeService.updateChallenge("1", {})).rejects.toThrow(
      errorMessage
    );
  });
});

describe("ChallengeService - deleteChallenge", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the challenge successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockChallengeRepository.deleteChallengeById.mockResolvedValue(mockResponse);

    const result = await challengeService.deleteChallenge(mockIds);
    expect(mockChallengeRepository.deleteChallengeById).toHaveBeenCalledWith(
      mockIds
    );
    expect(result).toEqual(mockResponse);
  });
});
