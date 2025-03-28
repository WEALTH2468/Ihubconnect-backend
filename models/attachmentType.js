const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentTypeSchema = new Schema({
  companyDomain:{type: String},
  name: { type: String },
});
const AttachmentType = mongoose.model('attachmentType', attachmentTypeSchema);

module.exports = AttachmentType;
