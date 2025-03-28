const Challenge = require("../../models/iperformance/challenge");

exports.getChallengeSummary = async (companyDomain) => {
  try {
    const challenges = await Challenge.find({
      companyDomain,
    });

    const totalChallenges = challenges.length;
    const completedChallenges = challenges.filter(
      (challenge) => challenge.status === "Completed"
    ).length;

    return { totalChallenges, completedChallenges };
  } catch (err) {
    throw err;
  }
};
