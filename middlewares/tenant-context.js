const requestContext = require("../request.context");

const tenantContext = async (req, res, next) => {
  if (req.auth) {
    const context = {
      userId: req.auth.userId,
      companyDomain: req.auth.companyDomain,
    };
    requestContext.run(context, next);
  } else {
    next();
  }
};

module.exports = tenantContext;
