const express = require('express');
const router = express.Router();
const MessageController = require("../controllers/message")
const userCtrl = require('../controllers/user');
const upload = require("../middlewares/multer-config")
const auth = require("../middlewares/auth")

router.post("/send/:contactId", auth, upload, MessageController.sendMessage);
router.patch('/isRead/:contactId', auth, MessageController.isRead);
router.delete('/:messageId', auth, MessageController.deleteMessage);
router.get('/messages/:contactId', auth, MessageController.getMessages);
router.patch("/messages/:messageId", auth, MessageController.editMessage);
router.get("/", auth, MessageController.getChats );
router.get("/contacts", auth, userCtrl.getUsersForChatSideBar );

module.exports = router;