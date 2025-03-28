const { differenceInDays } = require("date-fns");

class PeriodService {
  constructor(periodRepository) {
    this.periodRepository = periodRepository;
  }
  getQueryParams(filters) {
    let query = {};

    if (
      filters.searchQuery &&
      filters.searchQuery.length > 0 &&
      filters.searchQuery !== "undefined"
    ) {
      query.$or = [
        { code: { $regex: filters.searchQuery.trim(), $options: "i" } }, // Case-insensitive search for code
        { name: { $regex: filters.searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
    }

    return query;
  }

  async createPeriod(period) {
    return await this.periodRepository.createPeriod(period);
  }

  async getPeriods(filters) {
    const periodsPerFetch = 20;
    const limit = periodsPerFetch;
    const skip = filters.count * periodsPerFetch;
    const query = this.getQueryParams(filters);
    return await this.periodRepository.getPeriods(query, skip, limit);
  }

  async getPeriodById(id) {
    return await this.periodRepository.getPeriodById(id);
  }

  calculateDaysLeft(startDate, endDate) {
    const today = new Date();
    const beginningOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startDayInFuture =
      new Date(startDate).getTime() > beginningOfToday.getTime();
    const timestamp = startDayInFuture ? startDate : beginningOfToday.getTime();

    return differenceInDays(new Date(endDate), new Date(timestamp));
  }

  async updatePeriod(id, period) {
    const updatedPeriod = this.periodRepository.updatePeriodById(id, period);
    if (updatedPeriod.startDate && updatedPeriod.endDate) {
      updatedPeriod.daysLeft = this.calculateDaysLeft(
        updatedPeriod.startDate,
        updatedPeriod.endDate
      );
      await updatedPeriod.save();
    }

    return updatedPeriod;
  }

  async deletePeriod(ids) {
    return await this.periodRepository.deletePeriodById(ids);
  }
}

module.exports = PeriodService;
