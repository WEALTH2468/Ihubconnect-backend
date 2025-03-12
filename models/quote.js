const mongoose = require("mongoose");
const Counter = require("./counter");

const { Schema } = mongoose;

function padNumber(num, length) {
  return num.toString().padStart(length, "0");
}

function getPaymentTerms() {
  return "Payment Terms";
}

const itemDetailSchema = new Schema({
  service: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  bold: { type: Boolean },
  companyDomain: { type: String, required: true },
  description: { type: String, required: true },
  serviceName: { type: String, required: true },
  createdAt: { type: Number, required: true },
  updatedAt: { type: Number, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  range: { type: String },
  standard: { type: String },
  duration: { type: String },
});

const currencySchema = new Schema({
  _id: { type: String },
  name: { type: String },
});

const quoteSchema = new Schema({
  quoteNo: { type: String, required: true },
  title: { type: String, required: true },
  companyDomain: { type: String, required: true },
  attention: { type: String, required: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  total: { type: String, default: 0 },
  quoteDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  stage: {
    type: Array,
    default: [
      {
        id: "1",
        name: "Prepared",
        value: null,
      },
      { id: "2", name: "Reviewed", value: null },
      { id: "3", name: "Approved", value: null },
    ],
  },
  paymentTerms: { type: String, required: true, default: getPaymentTerms() },
  status: { type: String, default: "Open" },
  currency: { type: currencySchema, default: { _id: "NGN", name: "₦" } },
  discount: { type: Number, default: 0 },
  vat: { type: Number, default: 0 },
  increaseRatio: { type: Number, default: 0 },
  showTotal: { type: String, default: "Yes" },
  showPrice: { type: String, default: "Yes" },
  rev: { type: String },
  yourRef: { type: String },
  items: { type: [itemDetailSchema], required: true },
  attachments: { type: Schema.Types.ObjectId, ref: "Attachment" },
});

// eslint-disable-next-line func-names
quoteSchema.pre("validate", async function (next) {
  try {
    console.log({ companyDomain: this.companyDomain });
    const counter = await Counter.findOneAndUpdate(
      { counterId: "quoteId", companyDomain: this.companyDomain },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const currentYear = new Date().getFullYear();
    this.quoteNo = `MIL/BIL/${padNumber(counter.seq, 4)}/${currentYear}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Quote", quoteSchema);
