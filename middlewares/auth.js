const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.access_token, (err, decodedToken) => {
      if (err) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const userId = decodedToken.userId;
      const companyDomain = req.headers.origin.split("//")[1];
      req.auth = { companyDomain, userId };
      // req.auth = { userId };
      next();
    });
  } catch {
    res.status(401).json({
      error: new Error("Invalid request!"),
    });
  }
};

module.exports = auth;
