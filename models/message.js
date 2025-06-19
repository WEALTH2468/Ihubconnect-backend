const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    companyDomain: { type: String },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seen: { type: Boolean, default: false },

    content: { type: String },
    subject: { type: String },

    images: [
      {
        path: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],

    documents: [
      {
        path: { type: String, required: true },
        name: { type: String, required: true },
      },
    ],

    link: { type: String },

    isEdited: { type: Boolean, default: false },

    // 🔁 Reply reference
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, contactId: 1, seen: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
