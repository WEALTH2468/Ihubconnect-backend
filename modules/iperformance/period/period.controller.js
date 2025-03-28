const PeriodService = require("./period.service");
const PeriodRepository = require("./period.repository");
const periodService = new PeriodService(new PeriodRepository());

exports.createPeriod = async (req, res) => {
  try {
    const { name } = req.body;
    const data = {
      name,
      userId: req.auth.userId,
    };

    const newPeriod = await periodService.createPeriod(data);

    return res.status(201).json({
      message: "Period created successfully",
      period: newPeriod,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: error.message });
    }

    return res.status(500).json({ message: error.message });
  }
};

exports.getPeriods = async (req, res) => {
  try {
    const filters = {
      searchQuery: req.query.search ?? "",
    };
    const periods = await periodService.getPeriods(filters);
    return res.status(200).json(periods);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePeriod = async (req, res) => {
  try {
    const periodId = req.params.id;
    const data = req.body;
    const period = await periodService.updatePeriod(periodId, data);

    if (!period) {
      return res.status(404).json({ message: "Period not found" });
    }

    return res.status(200).json({ period });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.getPeriod = async (req, res) => {
  try {
    const periodId = req.params.id;
    const period = await periodService.getPeriodById(periodId);

    if (!period) {
      return res.status(200).json({ period: {} });
    }

    return res.status(200).json({ period });
  } catch (error) {
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePeriod = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No period IDs provided for bulk delete" });
    }

    const result = await periodService.deletePeriod(selectedIds);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No periods found for the provided IDs" });
    }

    return res.status(200).json({
      message: "Periods deleted successfully",
      ids: result.ids,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    if (error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};
