const RiskService = require("./risk.service");
const RiskRepository = require("./risk.repository");
const riskService = new RiskService(new RiskRepository());

exports.createRisk = async (req, res) => {
  try {
    const { title, status } = req.body;
    const data = {
      title,
      status,
      reportedBy: req.auth.userId,
      createdBy: req.auth.userId,
    };
    const newRisk = await riskService.createRisk(data);
    return res
      .status(201)
      .json({ message: "Risk created successfully", risk: newRisk });
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

exports.getRisks = async (req, res) => {
  try {
    const filters = {
      count: Number(req.query.count) || 0,
      searchQuery: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tasks: JSON.parse(req.query.tasks || "[]"),
    };

    if (!Array.isArray(filters.tasks)) {
      return res.status(400).json({ message: "Task filters must be an array" });
    }

    const risks = await riskService.getRisks(filters);

    return res.status(200).json(risks);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updateRisk = async (req, res) => {
  try {
    const riskId = req.params.id;
    const data = req.body;
    const risk = await riskService.updateRisk(riskId, data);

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    return res.status(200).json({ updatedRisk: risk });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.getRisk = async (req, res) => {
  try {
    const riskId = req.params.id;
    const risk = await riskService.getRiskById(riskId);

    if (!risk) {
      return res.status(404).json({ message: "Risk not found" });
    }

    return res.status(200).json({ risk });
  } catch (error) {
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteRisk = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No risk IDs provided for bulk delete" });
    }

    const result = await riskService.deleteRisk(selectedIds);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No risks found for the provided IDs" });
    }

    return res.status(200).json({
      message: "Risks deleted successfully",
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
