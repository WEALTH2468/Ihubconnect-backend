const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  companyDomain:{type: String},
  email: { type: String, required: true },
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  displayName: { type: String },
  password: { type: String, required: true },
  verificationCode: { type: String, required: true },
  verificationCodeExpiresAt: { type: Date, required: true },
});

// Generate a 6-digit verification code
tempUserSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log({code})
  this.verificationCode = code;
  this.verificationCodeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  return code;
};

tempUserSchema.methods.validateVerificationCode = function (code) {
  return (
    this.verificationCode === code &&
    this.verificationCodeExpiresAt > Date.now()
  );
};

const TempUser = mongoose.model("TempUser", tempUserSchema);

module.exports = TempUser;