const Risk = require("./risk.model");

class RiskRepository {
  async createRisk(risk) {
    return await Risk.create(risk);
  }

  async getRisks(query, skip, limit) {
    const risks = await Risk.aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await Risk.countDocuments(query);
    return {
      risks: risks,
      meta: {
        totalRowCount,
      },
    };
  }

  async getRiskById(id) {
    return await Risk.findById(id);
  }

  async updateRiskById(id, risk) {
    return await Risk.findByIdAndUpdate(id, risk, {
      new: true,
      runValidators: true,
    });
  }

  async deleteRiskById(ids) {
    const result = await Risk.deleteMany({ _id: { $in: ids } });
    return { deletedCount: result.deletedCount, ids };
  }
}

module.exports = RiskRepository;
