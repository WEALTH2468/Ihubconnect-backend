const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    unreadCount: { type: Number, default: 0 },
    muted: { type: Boolean, default: false },
    lastMessage: { type: String },
    lastMessageType: {
      type: String,
      enum: ["text", "image", "document", "link"],
      default: "text",
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // Add timestamps for createdAt and updatedAt
);

// Compound index for optimized queries
chatSchema.index({ participants: 1, lastMessageAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;