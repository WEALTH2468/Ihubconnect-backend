const Risk = require("../../models/iperformance/risk");

exports.getRiskSummary = async (companyDomain) => {
  try {
    const risks = await Risk.find({ companyDomain });

    const totalRisks = risks.length;
    const completedRisks = risks.filter(
      (risk) => risk.status === "Completed"
    ).length;

    return { totalRisks, completedRisks };
  } catch (err) {
    throw err;
  }
};
