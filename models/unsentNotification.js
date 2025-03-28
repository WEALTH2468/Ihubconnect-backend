const mongoose = require('mongoose');

const unsentNotificationSchema = mongoose.Schema({
  companyDomain:{type: String},
  senderId: String,
  receiverId: String,
  description: String,
  image: String,
  time: Number,
  read: Boolean,
  link: String,
  useRouter: Boolean
});

module.exports = mongoose.model('UnsentNotification', unsentNotificationSchema);

