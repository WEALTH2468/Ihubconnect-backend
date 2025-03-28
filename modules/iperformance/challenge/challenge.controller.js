const ChallengeService = require("./challenge.service");
const ChallengeRepository = require("./challenge.repository");
const challengeService = new ChallengeService(new ChallengeRepository());

exports.createChallenge = async (req, res) => {
  try {
    const { title, status } = req.body;
    const data = {
      title,
      status,
      reportedBy: req.auth.userId,
      createdBy: req.auth.userId,
    };
    const newChallenge = await challengeService.createChallenge(data);
    return res.status(201).json({
      message: "Challenge created successfully",
      challenge: newChallenge,
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

exports.getChallenges = async (req, res) => {
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

    const challenges = await challengeService.getChallenges(filters);
    return res.status(200).json(challenges);
  } catch (error) {
    if (error.name == "BSONError" || error.name == "CastError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.updateChallenge = async (req, res) => {
  try {
    const challengeId = req.params.id;
    const data = req.body;
    const challenge = await challengeService.updateChallenge(challengeId, data);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    return res.status(200).json({ updatedChallenge: challenge });
  } catch (error) {
    if (error.name == "CastError" || error.name == "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.getChallenge = async (req, res) => {
  try {
    const challengeId = req.params.id;
    const challenge = await challengeService.getChallengeById(challengeId);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    return res.status(200).json({ challenge });
  } catch (error) {
    if (error.name == "CastError" || error.name == "BSONError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    const selectedIds = req.body.ids || JSON.parse(req.query.ids);

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "No challenge IDs provided for bulk delete" });
    }

    const result = await challengeService.deleteChallenge(selectedIds);

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No challenges found for the provided IDs" });
    }

    return res.status(200).json({
      message: "Challenges deleted successfully",
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
