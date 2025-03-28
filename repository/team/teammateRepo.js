const Teammate = require("../../models/teammate");

exports.getTotalTeammate = async (companyDomain) => {
  try {
    const totalTeammates = await Teammate.find({
      companyDomain,
    }).countDocuments();
    return totalTeammates;
  } catch (err) {
    throw err;
  }
};
