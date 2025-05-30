const mongoose = require("mongoose");
const Counter = require("./counter");
const { Schema } = mongoose;

function padNumber(num, length) {
  return num.toString().padStart(length, "0");
}

const contactSchema = new Schema({
  name: { type: String },
  city: { type: String },
  country: { type: String },
  email: { type: String },
  phoneNumber: { type: String },
});

const customerSchema = new Schema({
  customerNo:{ type: String},
  type: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  companyDomain: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  customerPhoto: { type: String },
  contacts: { type: [contactSchema] },
});

// eslint-disable-next-line func-names
customerSchema.pre("validate", async function (next) {
  try {
    console.log({ companyDomain: this.companyDomain });
    const counter = await Counter.findOneAndUpdate(
      { counterId: "customerNo", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const currentYear = new Date().getFullYear();
    const lastTwoDigits = currentYear.toString().slice(-2);
    const currentMonth = new Date().getMonth();
    this.customerNo = `COY-${currentMonth}-${lastTwoDigits}-${padNumber(counter.seq, 4)}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Customer", customerSchema);
