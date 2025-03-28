const mongoose = require("mongoose");
const PeriodService = require("../period.service");
const PeriodRepository = require("../period.repository");

const mockPeriodRepository = new PeriodRepository();
mockPeriodRepository.createPeriod = jest.fn();
mockPeriodRepository.getPeriods = jest.fn();
mockPeriodRepository.getPeriodById = jest.fn();
mockPeriodRepository.updatePeriodById = jest.fn();
mockPeriodRepository.deletePeriodById = jest.fn();

// Inject the mock repository into TaskService
const periodService = new PeriodService(mockPeriodRepository);

describe("PeriodService - createPeriod", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should create a period successfully", async () => {
    const mockPeriod = {
      title: "Test Period",
      description: "Test Description",
    };
    mockPeriodRepository.createPeriod.mockResolvedValue(mockPeriod);

    const result = await periodService.createPeriod(mockPeriod);

    expect(mockPeriodRepository.createPeriod).toHaveBeenCalledWith(mockPeriod);
    expect(result).toEqual(mockPeriod);
  });

  it("should throw an error when task creation fails", async () => {
    const mockTask = { title: "Invalid Task" };
    const errorMessage = "Task creation failed";
    mockPeriodRepository.createPeriod.mockRejectedValue(
      new Error(errorMessage)
    );

    await expect(periodService.createPeriod(mockTask)).rejects.toThrow(
      errorMessage
    );
    expect(mockPeriodRepository.createPeriod).toHaveBeenCalledTimes(1);
  });
});

describe("PeriodService - getPeriods", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should get periods successfully", async () => {
    const mockFilters = { count: 1 };
    const mockPeriods = [
      { title: "Period 1", description: "Period 1 description" },
      { title: "Period 2", description: "Period 2 description" },
    ];

    const customPeriodService = new PeriodService(mockPeriodRepository);
    customPeriodService.getQueryParams = jest.fn();
    customPeriodService.getQueryParams.mockReturnValue({});
    mockPeriodRepository.getPeriods.mockResolvedValue(mockPeriods);

    const result = await customPeriodService.getPeriods(mockFilters);

    expect(result).toEqual(mockPeriods);
  });

  it("should throw an error when fetching tasks fails", async () => {
    const mockFilters = { count: 1 };
    const errorMessage = "Error fetching tasks";
    const customPeriodService = new PeriodService(mockPeriodRepository);
    customPeriodService.getQueryParams = jest.fn();
    customPeriodService.getQueryParams.mockReturnValue({});
    mockPeriodRepository.getPeriods.mockRejectedValue(new Error(errorMessage));

    await expect(customPeriodService.getPeriods(mockFilters)).rejects.toThrow(
      errorMessage
    );
  });
});

describe("PeriodService - getPeriodById", () => {
  it("should get the return the period by id", async () => {
    const mockPeriod = { id: "1", title: "Test Period" };

    mockPeriodRepository.getPeriodById.mockResolvedValue(mockPeriod);

    const result = await periodService.getPeriodById("1");
    expect(mockPeriodRepository.getPeriodById).toHaveBeenCalledWith("1");
    expect(result).toEqual(mockPeriod);
  });

  it("should throw an error when fetching period by id fails", async () => {
    const errorMessage = "Cannot get period";
    mockPeriodRepository.getPeriodById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(periodService.getPeriodById("1")).rejects.toThrow(
      errorMessage
    );
  });
});

describe("PeriodService - getQueryParams", () => {
  it("should return default query when no filters are applied", () => {
    const filters = {};
    const expectedQuery = {};

    const result = periodService.getQueryParams(filters);

    expect(result).toEqual(expectedQuery);
  });

  it("should construct a search query correctly", () => {
    const filters = { searchQuery: "test" };

    const expectedQuery = {
      $or: [
        { code: { $regex: "test", $options: "i" } },
        { name: { $regex: "test", $options: "i" } },
      ],
    };

    const result = periodService.getQueryParams(filters);
    expect(result).toEqual(expectedQuery);
  });
});

describe("PeriodService - updatePeriod", () => {
  it("should update the period successfully", async () => {
    const mockPeriod = { id: "1", title: "Updated Period" };
    mockPeriodRepository.updatePeriodById.mockResolvedValue(mockPeriod);

    const result = await periodService.updatePeriod("1", mockPeriod);
    expect(mockPeriodRepository.updatePeriodById).toHaveBeenCalledWith(
      "1",
      mockPeriod
    );
    expect(result).toEqual(mockPeriod);
  });

  it("should throw an error when updating task fails", async () => {
    const errorMessage = "Cannot update task";
    mockPeriodRepository.updatePeriodById.mockRejectedValue(
      new Error(errorMessage)
    );
    await expect(periodService.updatePeriod("1", {})).rejects.toThrow(
      errorMessage
    );
  });
});

describe("PeriodService - deletePeriod", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it("should delete the period successfully", async () => {
    const mockIds = ["1", "2"];
    const mockResponse = { ids: mockIds, deletedCount: 2 };
    mockPeriodRepository.deletePeriodById.mockResolvedValue(mockResponse);

    const result = await periodService.deletePeriod(mockIds);
    expect(mockPeriodRepository.deletePeriodById).toHaveBeenCalledWith(mockIds);
    expect(result).toEqual(mockResponse);
  });
});
