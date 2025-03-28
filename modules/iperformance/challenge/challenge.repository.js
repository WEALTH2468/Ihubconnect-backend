const Challenge = require("./challenge.model");

class ChallengeRepository {
  async createChallenge(challenge) {
    return await Challenge.create(challenge);
  }

  async getChallenges(query, skip, limit) {
    const challenges = await Challenge.aggregate([
      {
        $match: query,
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalRowCount = await Challenge.countDocuments(query);
    return {
      challenges: challenges,
      meta: {
        totalRowCount,
      },
    };
  }

  async getChallengeById(id) {
    return await Challenge.findById(id);
  }

  async updateChallengeById(id, challenge) {
    return await Challenge.findByIdAndUpdate(id, challenge, {
      new: true,
      runValidators: true,
    });
  }

  async deleteChallengeById(ids) {
    const result = await Challenge.deleteMany({ _id: { $in: ids } });
    return { deletedCount: result.deletedCount, ids };
  }
}

module.exports = ChallengeRepository;
