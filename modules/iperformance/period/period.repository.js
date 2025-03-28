const Period = require("./period.model");

class PeriodRepository {
  async createPeriod(period) {
    return await Period.create(period);
  }

  async getPeriods(query, skip, limit) {
    const periods = await Period.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalRowCount = await Period.countDocuments(query);
    return {
      periods: periods,
      meta: {
        totalRowCount,
      },
    };
  }

  async getPeriodById(id) {
    let period;
    if (id === "active") {
      period = await Period.findOne({ status: "In progress" });
    } else {
      period = await Period.findById(id);
    }

    return period;
  }

  async updatePeriodById(id, period) {
    return await Period.findByIdAndUpdate(
      id,
      { ...period, updatedAt: new Date().getTime() },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deletePeriodById(ids) {
    const result = await Period.deleteMany({ _id: { $in: ids } });
    return { deletedCount: result.deletedCount, ids };
  }
}

module.exports = PeriodRepository;
