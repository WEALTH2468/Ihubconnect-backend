const mongoose = require('mongoose');

const { Schema } = mongoose;

const contactSchema = new Schema({
  name: { type: String },
  city: { type: String },
  country: { type: String },
  email: { type: String },
  phoneNumber: { type: String },
});

const customerSchema = new Schema({
  type: { type: String, required: true },
  category: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  customerPhoto: { type: String },
  contacts: { type: [contactSchema] },
});

module.exports = mongoose.model('Customer', customerSchema);
