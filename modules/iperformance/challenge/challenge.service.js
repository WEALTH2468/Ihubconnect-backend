const { default: mongoose } = require("mongoose");

class ChallengeService {
  constructor(challengeRepository) {
    this.challengeRepository = challengeRepository;
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

  async createChallenge(challenge) {
    return await this.challengeRepository.createChallenge(challenge);
  }

  async getChallenges(filters) {
    const challengesPerFetch = 20;
    const limit = challengesPerFetch;
    const skip = filters.count * challengesPerFetch;
    const query = this.getQueryParams(filters);
    return await this.challengeRepository.getChallenges(query, skip, limit);
  }

  async getChallengeById(id) {
    return await this.challengeRepository.getChallengeById(id);
  }

  async updateChallenge(id, challenge) {
    return await this.challengeRepository.updateChallengeById(id, challenge);
  }

  async deleteChallenge(ids) {
    return await this.challengeRepository.deleteChallengeById(ids);
  }
}

module.exports = ChallengeService;
