const Message = require("../models/message");
const Chat = require("../models/chat");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

async function createIndexes() {
  try {
    await Chat.createIndexes();
    await Message.createIndexes();
    console.log('Indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}


exports.sendMessage = async (req, res) => {
  try {
    const companyDomain = req.headers.origin.split('//')[1];
    const date = new Date();
    const { messageText: content, subject, link } = req.body;
    const { contactId } = req.params;
    const { userId, avatar } = req.auth;

    // Extract files from the request
    const images = req.files?.picture || [];
    const documents = req.files?.document || [];


    // File paths and names (already saved by multer)
    const uploadedImages = images.map((image) => ({
      path: `/images/${image.filename}`,
      name: image.originalname,
    }));

    const uploadedDocuments = documents.map((document) => ({
      path: `/document-library/${document.filename}`,
      name: document.originalname,
    }));


    // Find or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, contactId] },
    });

    if (!chat) {
      chat = new Chat({
        companyDomain,
        participants: [userId, contactId],
        messages: [],
      });
    }

    // Create a new message
    const message = new Message({
      companyDomain,
      chatId: chat._id,
      avatar,
      userId,
      contactId,
      subject,
      images: uploadedImages, // Store image paths in DB
      documents: uploadedDocuments, // Store document paths in DB
      content: content?.trim() || "", // Trim whitespace to prevent empty content issues
      link,
      isEdited: false,
    });

    // Save message first before updating chat
    await message.save();

    // Ensure messages array exists before pushing
    if (!chat.messages) {
      chat.messages = [];
    }

    // Update chat with the last message
    chat.lastMessage =
      content?.trim() ||
      (uploadedImages.length > 0 || uploadedDocuments.length > 0
        ? "[Attachment]"
        : "No message");

    chat.lastMessageAt = date;
    chat.messages.push(message._id);

    // Save chat in parallel with message
    await chat.save();

    res
      .status(201)
      .json(chat.messages.length === 1 ? { message, chat } : message);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ message: error.message });
  }
};


exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params; // Extract messageId from request params
    const { userId } = req.auth; // Get userId from auth middleware

    console.log("Deleting message:", messageId, "by user:", userId);

    // Find the message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    console.log("Message found:", message);

    // Delete attached files (images & documents)
    const deleteFile = (filePath) => {
      const absolutePath = path.join(__dirname, "..", filePath); // Adjust path if needed
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted file: ${absolutePath}`);
      }
    };

    if (message.images?.length > 0) {
      message.images.forEach(({ path }) => deleteFile(path)); // Use `path`
    }

    if (message.documents?.length > 0) {
      message.documents.forEach(({ path }) => deleteFile(path)); // Use `path`
    }

    // Delete message from database
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      message: "Message and associated files deleted successfully",
      messageId,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params; // Get message ID from URL params
    const { text } = req.body; // Get updated text from request body
    const { userId } = req.auth; // Get user ID from auth middleware

    console.log(messageId, text, userId);

    // Find the message by ID and ensure it belongs to the authenticated user
    const message = await Message.findByIdAndUpdate(
      messageId,
      { content: text, isEdited: true }, 
      { new: true } // Return the updated message
    );

    console.log("Updated message:", message);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json({
      message: "Message updated successfully",
      updatedMessage: message,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};






    

exports.isRead = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId } = req.auth;

    const chat = await Chat.findOne({
      participants: { $all: [userId, contactId] },
    }).select('_id');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    const result = await Message.updateMany(
      { chatId: chat._id, contactId: userId, seen: false },
      { $set: { seen: true } }
    );

    res.status(200).json({
      message: `${result.nModified} messages marked as read`,
      chatId: chat._id,
      contactId: userId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { userId } = req.auth;

    let chat = await Chat.findOne({
      participants: { $all: [userId, contactId] },
    }).populate("messages");

    chat ? res.status(200).json(chat.messages) : res.status(200).json([]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const { userId } = req.auth;

    let chat = await Chat.find({ participants: { $in: userId } }).populate(
      "messages"
    );

    chat.sort(
      (d1, d2) =>
        new Date(d2.lastMessageAt).getTime() -
        new Date(d1.lastMessageAt).getTime()
    );

    if (chat) {
      chat = chat.map((item) => {
        const count = item.messages.reduce(
          (acc, curr) =>
            acc + (curr.seen === false && curr.contactId == userId ? 1 : 0),
          0
        );
        return {
          _id: item._id,
          unreadCount: count,
          contactId: item.contactId,
          participants: item.participants,
          muted: item.muted,
          lastMessage: item.lastMessage,
          lastMessageAt: item.lastMessageAt,
        };
      });
    }
    chat ? res.status(200).json(chat) : res.status(200).json([]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};