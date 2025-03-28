const mongoose = require("mongoose");
const RiskService = require("../risk.service");
const RiskRepository = require("../risk.repository");

const mockRiskRepository = new RiskRepository();
mockRiskRepository.createRisk = jest.fn();
mockRiskRepository.getRisks = jest.fn();
mockRiskRepository.getRiskById = jest.fn();
mockRiskRepository.updateRiskById = jest.fn();
mockRiskRepository.deleteRiskById = jest.fn();

// Inject the mock repository into TaskService
const riskService = new RiskService(mockRiskRepository);

describe("RiskService - createRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a risk successfully", async () => {
    const mockRisk = { title: "Test Risk", description: "Test Description" };
    mockRiskRepository.createRisk.mockResolvedValue(mockRisk);

    const result = await riskService.createRisk(mockRisk);

    expect(mockRiskRepository.createRisk).toHaveBeenCalledWith(mockRisk);
    expect(result).toEqual(mockRisk);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockRiskRepository.createRisk.mockRejectedValue(new Error(errorMessage));

    await expect(riskService.createRisk(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockRiskRepository.createRisk).toHaveBeenCalledTimes(1);
  });
});

describe("RiskService - getRisks", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get risks successfully", async () => {
    const mockFilters = { count: 1 };
    const mockRisks = [
      { title: "Risk 1", description: "Risk 1 description" },
      { title: "Risk 2", description: "Risk 2 description" },
    ];

    const customRiskService = new RiskService(mockRiskRepository);
    customRiskService.getQueryParams = jest.fn();
    customRiskService.getQueryParams.mockReturnValue({});
    mockRiskRepository.getRisks.mockResolvedValue(mockRisks);

    const result = await customRiskService.getRisks(mockFilters);

    expect(result).toEqual(mockRisks);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customRiskService = new RiskService(mockRiskRepository);
    customRiskService.getQueryParams = jest.fn();
    customRiskService.getQueryParams.mockReturnValue({});
    mockRiskRepository.getRisks.mockRejectedValue(new Error(errorMessage));

    await expect(customRiskService.getRisks(mockFilters)).rejects.toThrow(
      errorMessage
    );
  });
});

describe("RiskService - getRiskById", () => {
  it("should get the return the risk by id", async () => {
    const mockRisk = { id: "1", title: "Test Risk" };

    mockRiskRepository.getRiskById.mockResolvedValue(mockRisk);

    const result = await riskService.getRiskById("1");
    expect(mockRiskRepository.getRiskById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockRisk);
  });

  it("should throw an error when fetching risk by id fails", async () => {
    const errorMessage = "Cannot get risk";
    mockRiskRepository.getRiskById.mockRejectedValue(new Error(errorMessage));
    await expect(riskService.getRiskById("1")).rejects.toThrow(errorMessage);
  });
});

describe("RiskService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = {};

    const result = riskService.getQueryParams(filters);

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

    const result = riskService.getQueryParams(filters);
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

    const result = riskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });

  it("should filter by startDate and endDate", () => {
    const filters = { startDate: "1700000000000", endDate: "1800000000000" };
    const expectedQuery = {
      startDate: { $gte: 1700000000000 },
      endDate: { $lte: 1800000000000 },
    };

    const result = riskService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });
});

describe("RiskService - updateRisk", () => {
  it("should update the risk successfully", async () => {
    const mockRisk = { id: "1", title: "Updated Risk" };
    mockRiskRepository.updateRiskById.mockResolvedValue(mockRisk);

    const result = await riskService.updateRisk("1", mockRisk);
    expect(mockRiskRepository.updateRiskById).toHaveBeenCalledWith(
      "1",
      mockRisk
    );
    expect(result).toEqual(mockRisk);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockRiskRepository.updateRiskById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(riskService.updateRisk("1", {})).rejects.toThrow(errorMessage);
  });
});

describe("RiskService - deleteRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the risk successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockRiskRepository.deleteRiskById.mockResolvedValue(mockResponse);

    const result = await riskService.deleteRisk(mockIds);
    expect(mockRiskRepository.deleteRiskById).toHaveBeenCalledWith(mockIds);
    expect(result).toEqual(mockResponse);
  });
});
