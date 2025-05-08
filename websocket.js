const SocketIO = require("socket.io");
const nodemailer = require("nodemailer");
const UnsentNotification = require("./models/unsentNotification");
const jwt = require("jsonwebtoken");
const Message = require("./models/message");
const User = require("./models/user");
const Settings = require("./models/settings");

const transporter = nodemailer.createTransport({
     service: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: "izone5.nigeria@gmail.com",
        pass: "xsmtpsib-f14b551b5df332e938fd74985c0315fbfce8c88372b026cb4bc7ddd284abf9be-XzUHJEyrVCSdchOp",
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
    const companyDomain = socket.handshake.query?.companyDomain?.split("//")[1];
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

  // const sendEmailNotification = async (data) => {
  //   const mailOptions = {
  //     from: "izone5.media@gmail.com",
  //     to: data.receivers.map((user) => user.email).join(", "),
  //     subject: data.subject,
  //     html: data.description,
  //   };

  //   try {
  //     const info = await transporter.sendMail(mailOptions);
  //     console.log("Message sent: %s", info.messageId);
  //   } catch (error) {
  //     console.error("Error occurred:", error);
  //   }
  // };

  const sendEmailNotification = async (data) => {
    const settings = await Settings.find({
      companyDomain: data.companyDomain?.split("//")[1],
    });
    let companyName;

    if (settings.length === 0) {
      companyName = "";
    }
    companyName = settings[0]?.companyDomain;

    try {
      const emailPromises = data.receivers.map((receiver) => {
        const html = `<body style="margin: 0; padding: 0; background: #f8f9fb; text-align: center;">
            <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td align="center" valign="middle">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid #ddd;">
                            
                            <tr>
                                <td style="font-size: 14px; color: #555;">Dear <strong>${
                                  receiver.firstName
                                } ${receiver.lastName}</strong>,</td>
                            </tr>
                            <tr>
                                <td style="font-size: 14px; color: #555; padding: 10px 0;">${
                                  data.description
                                }</td>
                            </tr>
                            ${
                              data.href
                                ? `
                              <tr>
                                  <td style="padding: 20px 0;">
                                      <a href="${data.href}" style="display: inline-block; background: black; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">View</a>
                                  </td>
                              </tr>
                              `
                                : ""
                            }
                            <tr>
                                <td style="font-size: 12px; color: #777;">If you have any questions, feel free to reach out to your team.</td>
                            </tr>
                            <tr>
                                <td style="font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px;">
                                    <p>Thank you,</p>
                                    <p><strong>${companyName} Team</strong></p>
                                    <p style="font-size: 10px;">This is an automated message, please do not reply.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>`;

        const mailOptions = {
          from: "izone5.media@gmail.com",
          to: receiver.email, // Send an individual email to each user
          subject: data.subject,
          html: html,
        };

        return transporter.sendMail(mailOptions);
      });

      const results = await Promise.allSettled(emailPromises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(
            `Message sent to ${data.receivers[index].email}: ${result.value.messageId}`
          );
        } else {
          console.error(
            `Error occurred for ${data.receivers[index].email}:`,
            result.reason
          );
        }
      });
    } catch (error) {
      console.error("Bulk email sending failed:", error);
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

    console.log({ In: onlineUsers });

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
      sendEmailNotification(data);
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

    socket.on("markMessageAsSeen", async ({ messageId, senderId }) => {
      // Update message in DB
      await Message.findByIdAndUpdate(messageId, { seen: true });   
      // Notify the sender that the message has been seen
      io.to(senderId).emit("messageSeen", { messageId });
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
