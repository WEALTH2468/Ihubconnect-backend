const SocketIO = require("socket.io");
const nodemailer = require("nodemailer");
const UnsentNotification = require("./models/unsentNotification");
const jwt = require("jsonwebtoken");
const Message = require("./models/message");
const User = require("./models/user");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "izone5.media@gmail.com",
    pass: "niwlnbyxupfhcpmm",
  },
});

const initSocketIO = (httpServer) => {
  const io = new SocketIO.Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.frontend_domain.split(","),
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    const companyDomain = socket.handshake.query.companyDomain.split("//")[1];
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    try {
      const decodedToken = jwt.verify(token, process.env.access_token);
      socket.userId = decodedToken?.userId; // Attach user info to the socket
      socket.companyDomain = companyDomain;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  let onlineUsers = {};

  const addNewUser = (data) => {
    if (!onlineUsers[data.userId]) {
      onlineUsers[data.userId] = [
        data.socket.id,
        data.status,
        data.companyDomain,
      ];
    }
  };

  const removeUser = (userId) => {
    delete onlineUsers[userId];
  };

  const getContactSocketId = (userId) => {
    return onlineUsers[userId] ? onlineUsers[userId][0] : null;
  };

  const storedNotificationForUser = async (data) => {
    try {
      const {
        senderId,
        receiverId,
        description,
        image,
        read,
        link,
        useRouter,
      } = data;

      const newUnsentNotification = new UnsentNotification({
        senderId,
        receiverId,
        description,
        image,
        read,
        link,
        useRouter,
        time: Date.now(),
      });
      await newUnsentNotification.save();
    } catch (error) {
      console.error(error);
    }
  };

  const getStoredNotificationsForUser = async (userId, socket) => {
    try {
      const unsentNotifications = await UnsentNotification.find({
        receiverId: userId,
      });

      unsentNotifications.forEach((notification) => {
        io.to(socket.id).emit("emitNotification", notification);
      });
      clearStoredNotificationsForUser(userId);
    } catch (err) {
      console.error(err);
    }
  };

  const clearStoredNotificationsForUser = async (userId) => {
    try {
      await UnsentNotification.deleteMany({ receiverId: userId });
    } catch (err) {
      console.error(err);
    }
  };

  const sendEmailNotification = async (data) => {
    const mailOptions = {
      from: "izone5.media@gmail.com",
      to: data.receivers.map((user) => user.email).join(", "),
      subject: data.subject,
      html: data.description,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Message sent: %s", info.messageId);
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const emitNotification = (data) => {
    const onlineIds = Object.entries(onlineUsers)
      .filter((user) => data.receivers.some((item) => user[0] === item._id))
      .map((item) => item[1][0]);

    const offlineUsers = data.receivers.filter(
      (user) =>
        !Object.entries(onlineUsers).some((item) => item[0] === user._id)
    );

    if (onlineIds.length > 0) {
      io.to(onlineIds).emit("emitNotification", data);
    }
    if (offlineUsers.length > 0) {
      offlineUsers.forEach((user) => {
        data.receiverId = user._id;
        storedNotificationForUser(data);
      });
    }
  };

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const companyDomain = socket.companyDomain;
    const lastLogin = new Date();

    addNewUser({ companyDomain, userId, socket, status: "online" });

    console.log({In: onlineUsers})

    io.emit("onlineUsers", onlineUsers);

    getStoredNotificationsForUser(userId, socket);
    await User.findOneAndUpdate(
      { _id: userId },
      { lastLogin: lastLogin.toISOString() },
      { new: true }
    );
    socket.on("refreshPost", (post) => {
      const usersSocketId = Object.entries(onlineUsers)
        .filter((user) => user[1][2] === post.payload.companyDomain)
        .map((item) => item[1][0]);

      console.log({ usersSocketId });

      io.to(usersSocketId).emit("refreshPost", post);
    });

    socket.on("emitGetUsers", () => {
      io.emit("emitGetUsers");
    });

    socket.on("emitEmailAndNotification", async (data) => {
      emitNotification(data);
      // sendEmailNotification(data)
    });

    socket.on("emitNotification", (data) => {
      emitNotification(data);
    });

    socket.on("emitSendChat", (data) => {
      const message = data.chat ? data.message : data;
      const socketId = getContactSocketId(message.contactId);
      if (socketId) {
        // Emit message to receiver
        io.to(socketId).emit("sendChat", data);
        console.log("Message sent:");
      } else {
        console.error("Receiver not found for message:", data);
      }
    });

    socket.on("emitSendPanelChat", (data) => {
      const message = data.chat ? data.message : data;
      const socketId = getContactSocketId(message.contactId);
      if (socketId) {
        // Emit message to receiver
        io.to(socketId).emit("sendPanelChat", data);
        console.log("Message sent:");
      } else {
        console.error("Receiver not found for message:", data);
      }
    });

    socket.on("updateStatus", async (data) => {
      onlineUsers[userId][1] = data;
      io.emit("onlineUsers", onlineUsers);
    });

    socket.on("disconnect", async () => {
      removeUser(userId);
      // console.log({Out: onlineUsers})
      io.emit("onlineUsers", onlineUsers);
    });
  });

  return {
    getContactSocketId,
    emitNotification,
  };
};

module.exports = initSocketIO;
