const { default: mongoose } = require("mongoose");

class RiskService {
  constructor(riskRepository) {
    this.riskRepository = riskRepository;
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
        { title: { $regex: filters.searchQuery.trim(), $options: "i" } }, // Case-insensitive search for task
      ];
    }

    if (filters.tasks?.length > 0) {
      query.taskId = {
        $in: filters.tasks.map((taskId) => new mongoose.Types.ObjectId(taskId)),
      };
    }

    if (filters.userIds?.length > 0) {
      query.reportedBy = { $in: filters.userIds };
    }

    if (filters.startDate && filters.startDate !== "NaN") {
      query.startDate = { $gte: Number(filters.startDate) };
    }

    if (filters.endDate && filters.endDate !== "NaN") {
      query.endDate = { $lte: Number(filters.endDate) };
    }
    return query;
  }

  async createRisk(risk) {
    return await this.riskRepository.createRisk(risk);
  }

  async getRisks(filters) {
    const risksPerFetch = 20;
    const limit = risksPerFetch;
    const skip = filters.count * risksPerFetch;
    const query = this.getQueryParams(filters);
    return await this.riskRepository.getRisks(query, skip, limit);
  }

  async getRiskById(id) {
    return await this.riskRepository.getRiskById(id);
  }

  async updateRisk(id, risk) {
    return await this.riskRepository.updateRiskById(id, risk);
  }

  async deleteRisk(ids) {
    return await this.riskRepository.deleteRiskById(ids);
  }
}

module.exports = RiskService;
