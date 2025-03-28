const bcrypt = require("bcrypt");
const Role = require("../models/rbac/role");
const User = require("../models/user");
const Weight = require("../models/weight");
const TempUser = require("../models/tempUser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { sendMail } = require("../utils/sendMail");
const { HandleError } = require("../utils/error");
const { CatchErrorFunc } = require("../utils/CatchErrorFunc");
const crypto = require("crypto");
const { error } = require("console");
const { Error } = require("mongoose");
const {
  getGravatarBlob,
  saveImageBlob,
} = require("../utils/getDefaultsAvater");
const Mustache = require("mustache");
const { removeListener } = require("../models/post");
const { getLogo } = require("./settings");
const Settings = require("../models/settings");

const signToken = (userId) => {
  return jwt.sign({ userId: userId }, process.env.access_token, {
    expiresIn: process.env.expire_time,
  });
};

const getUserWithUnitsMembers = async (companyDomain, userId) => {
  try {
    // Find the user based on userId
    const userNewData = await User.findOne({ companyDomain, _id: userId })
      .populate("jobPosition")
      .lean();
    const roleData = await Role.findOne({ _id: userNewData?.roleId }).lean();
    if (roleData) {
      userNewData.role = roleData.name.toLowerCase();
    }
    if (!userNewData) {
      throw new Error("User not found");
    }

    // Find unitsMembers based on the units field of the found user
    const unitsMembers = await User.find(
      {
        companyDomain,
        units: { $in: userNewData.units },
        _id: { $ne: userNewData._id },
      },
      { displayName: 1, _id: 1, units: 1, avatar: 1 }
    );

    if (roleData) {
      userNewData.permissions = Mustache.render(
        roleData.permissions,
        userNewData
      );
    }

    delete userNewData.password;

    userNewData.unitsMembers = unitsMembers;

    return userNewData;
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

exports.getUsers = async (req, res, next) => {
  const companyDomain = req.headers.origin.split("//")[1];

  try {
    const userId = req.params.id;
    if (userId == "undefined") {
      const users = await User.find(
        { companyDomain, isActive: true },
        { password: 0 }
      ).populate("jobPosition");
      return res.status(200).json(users);
    }

    const user = await getUserWithUnitsMembers(companyDomain, userId);

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res, next) => {
  const companyDomain = req.headers.origin.split("//")[1];

  try {
    const users = await User.find({ companyDomain }, { password: 0 }).populate(
      "jobPosition"
    );
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getUsersForChatSideBar = async (req, res, next) => {
  const companyDomain = req.headers.origin.split("//")[1];

  try {
    const { userId } = req.auth;
    const users = await User.find(
      { companyDomain, _id: { $ne: userId }, isActive: true },
      { password: 0 }
    );

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
exports.refresh = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const { userId } = req.auth;

    const user = await getUserWithUnitsMembers(companyDomain, userId);

    const access_token = signToken(user._id);

    return res.status(200).json({ access_token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.signup = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const settings = await Settings.find({ companyDomain });
    console.log({ settings: settings.length < 1 });
    const companyName = settings.length > 0 ? settings[0].companyDomain : "";

    const { email, displayName, password, firstName, lastName } = req.body;

    const userNewData = await User.findOne({ companyDomain, email }).lean();
    if (!!userNewData) {
      return res.status(409).json([
        {
          type: "email",
          message: "The email address is already in use",
          status: 409,
        },
      ]);
    }

    const tempUser = await TempUser.findOne({ companyDomain, email });
    if (tempUser) {
      // If the email exists in TempUser, update the verification code and resend the email
      tempUser.generateVerificationCode();
      await tempUser.save();

      const access_token = signToken(tempUser._id);
      const html = `
              <body style="margin: 0; padding: 0; background: #f8f9fb; text-align: center;">
    <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center" valign="middle">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid #ddd;">
                    <tr>
                        <td style="font-size: 18px; font-weight: bold; color: #333; padding-bottom: 15px;">
                            You have requested a One-Time Password for ${companyName}.
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block; font-size: 28px; font-weight: bold; color: #000; letter-spacing: 2px; width: auto; min-width: 120px; text-align: center;">
                            ${tempUser.verificationCode}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555; padding-top: 10px;">
                            This code is only valid for 10 minutes. <strong>DO NOT SHARE</strong>. ${companyName} agents will never ask for this code.
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555; padding-top: 10px;">
                            If you didn't request this, please ensure your account security is up to date.
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px;">
                            &copy; 2025 ${companyName}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
            `;

      await sendMail({
        email: tempUser.email,
        subject: "Email Verification",
        // message: `Your new verification code is: ${tempUser.verificationCode}`,
        html,
      });

      return res.status(200).json({
        access_token,
        tempUser,
        message:
          "Email verification already pending. A new verification code has been sent to your email.",
      });
    }

    // If the email doesn't exist in TempUser, create a new entry
    const hash = await hashPassword(password);

    const newTempUser = new TempUser({
      companyDomain,
      firstName,
      lastName,
      email,
      displayName,
      password: hash,
    });

    newTempUser.generateVerificationCode();

    const userSaved = await newTempUser.save();

    const access_token = signToken(newTempUser._id);

    // Send verification email
    await sendMail({
      email: userSaved.email,
      subject: "Email Verification",
      message: `Your verification code is: ${userSaved.verificationCode}`,
    });

    return res.status(200).json({
      access_token,
      userSaved,
      message:
        "User created successfully. A verification code has been sent to your email.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "An error occurred, please try again.",
      status: 500,
      error: error.message || error,
    });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const settings = await Settings.find({ companyDomain });

    if (settings.length === 0) {
      return res.status(404).json({ message: "Settings not found" });
    }
    const companyName = settings[0].companyDomain;

    const verifiedID = req.auth.userId;

    const tempUser = await TempUser.findById(verifiedID);
    if (!tempUser) {
      return res.status(404).json({
        message: "No pending verification found for this user.",
      });
    }

    // Generate a new verification code and update the timestamp
    tempUser.generateVerificationCode();

    await tempUser.save();

    const access_token = signToken(tempUser._id);

    const html = `
              <body style="margin: 0; padding: 0; background: #f8f9fb; text-align: center;">
    <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center" valign="middle">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid #ddd;">
                    <tr>
                        <td style="font-size: 18px; font-weight: bold; color: #333; padding-bottom: 15px;">
                            You have requested a One-Time Password for ${companyName}.
                        </td>
                    </tr>
                    <tr>
                        <td style="background: #f4f4f4; padding: 15px; border-radius: 8px; display: inline-block; font-size: 28px; font-weight: bold; color: #000; letter-spacing: 2px; width: auto; min-width: 120px; text-align: center;">
                            ${tempUser.verificationCode}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555; padding-top: 10px;">
                            This code is only valid for 10 minutes. <strong>DO NOT SHARE</strong>. ${companyName} agents will never ask for this code.
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555; padding-top: 10px;">
                            If you didn't request this, please ensure your account security is up to date.
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 15px;">
                            &copy; 2025 ${companyName}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
            `;

    // Resend the verification email
    await sendMail({
      email: tempUser.email,
      subject: "Resend Email Verification",
      //message: `Your new verification code is: ${tempUser.verificationCode}`,
      html,
    });

    return res.status(200).json({
      access_token,
      tempUser,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while resending the verification code.",
      error: error.message || error,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const { verificationCode } = req.body;
    const verifiedID = req.auth.userId;

    if (!verifiedID) {
      return res.status(401).json({ message: "Unauthorized", status: 401 });
    }

    const tempUser = await TempUser.findById(verifiedID);

    if (!tempUser) {
      return res
        .status(404)
        .json({ message: "No verification record found.", status: 404 });
    }

    if (
      tempUser.verificationCode !== verificationCode ||
      new Date() > tempUser.verificationCodeExpiresAt
    ) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
        status: 400,
      });
    }

    // Move data to User collection
    const { displayName, password, email, firstName, lastName } = tempUser;

    const userNewData = await User.findOne({ companyDomain, email }).lean();
    if (!!userNewData) {
      return res.status(409).json([
        {
          type: "email",
          message: "The email address is already in use",
          status: 409,
        },
      ]);
    }

    const role = await Role.findOne({ name: "guest" });
    const newUser = new User({
      companyDomain,
      displayName,
      firstName,
      lastName,
      email,
      emails: [{ email: tempUser.email, label: "primary" }],
      phoneNumbers: [
        {
          country: "ng",
          phoneNumber: "",
          label: "",
        },
      ],
      password,
      roleId: role._id,
      status: "offline",
      isVerified: true,
    });

    const userSaved = await newUser.save();

    const user = await getUserWithUnitsMembers(companyDomain, userSaved._id);
    const access_token = signToken(user._id);

    res.status(200).json({
      access_token,
      user,
      message: "Email verified successfully. Account created.",
    });

    // Remove the temp user record
    await TempUser.deleteOne({ _id: verifiedID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error.", status: 500 });
  }
};

exports.addUser = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const data = JSON.parse(req.body.user);
    const url = req.protocol + "://" + req.get("host");

    Object.keys(req.files).forEach((key, index) => {
      data[key] = url + "/images/" + req.files[key][0].filename;
    });

    const {
      background,
      avatar,
      role,
      displayName,
      email,
      emails,
      phoneNumbers,
      address,
      firstName,
      lastName,
      departmentId,
      units,
      aboutMe,
      gender,
      jobPosition,
      city,
      birthday,
      password,
      isActive,
      isVerified,
    } = data;

    const userNewData = await User.findOne({ companyDomain, email }).lean();

    if (!!userNewData) {
      return res.status(500).json([
        {
          type: "email",
          message: "The email address is already in use",
        },
      ]);
    }

    const hash = await hashPassword(password);

    const newUser = new User({
      companyDomain,
      background,
      avatar,
      role,
      displayName,
      email,
      emails,
      phoneNumbers,
      address,
      firstName,
      lastName,
      departmentId,
      units,
      aboutMe,
      gender,
      jobPosition,
      city,
      birthday,
      password: hash,
      isActive,
      isVerified,
    });
    const addedUser = await newUser.save();

    return res.status(200).json({
      addedUser,
      message: "User Added Successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const { email, password } = req.body;
    const userNewData = await User.findOne({
      companyDomain,
      email,
    }).lean();

    if (!userNewData) {
      return res.status(404).json([
        {
          type: "email",
          message: "User not Found, Please sign-Up!",
          status: 404,
        },
      ]);
    }

    if (!userNewData.isActive) {
      return res.status(400).json({
        message: "Account has been deactivated",
      });
    }

    const isMatch = await bcrypt.compare(password, userNewData.password);
    if (!isMatch) {
      return res.status(401).json([
        {
          type: "password",
          message: "Incorrect Password",
          status: 401,
        },
      ]);
    }

    const user = await getUserWithUnitsMembers(companyDomain, userNewData._id);

    const access_token = signToken(user._id);

    return res.status(200).json({
      access_token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];

    const { userId: authId } = req.auth;

    const userId = req.params.id;
    const userNewData = JSON.parse(req.body.user);
    const user = await User.findOne({
      companyDomain,
      email: userNewData.emails[0]?.email,
    }).lean();

    if (authId == userId && userNewData.newPassword) {
      if (!userNewData.password) {
        return res.status(400).json([
          {
            type: "password",
            message:
              "Please provide your former password to create New password!",
          },
        ]);
      }
      const isMatch = await bcrypt.compare(userNewData.password, user.password);

      if (!isMatch) {
        return res.status(400).json([
          {
            type: "password",
            message:
              "Please provide your former password to create New password!",
          },
        ]);
      }

      const hash = await hashPassword(userNewData.newPassword);
      userNewData.password = hash;
    } else if (userNewData.newPassword) {
      userNewData.password = await hashPassword(userNewData.newPassword);
    } else {
      delete userNewData.password;
    }

    Object.keys(req.files).forEach((key, index) => {
      if (userNewData[key]) {
        const fileName = userNewData[key].split("/images/")[1];
        fs.unlink("images/" + fileName, () => {
          userNewData[key] = "/images/" + req.files[key][0].filename;
        });
      }

      userNewData[key] = "/images/" + req.files[key][0].filename;
    });

    // Apply Gravatar fallback as Blob for avatar and background
    if (!userNewData.avatar || userNewData.avatar === "") {
      const gravatarBlob = await getGravatarBlob(
        userNewData.emails[0]?.email,
        200
      );
      userNewData.avatar = saveImageBlob(
        gravatarBlob,
        `avatar-${Date.now()}.jpg`
      );
    }

    if (!userNewData.background || userNewData.background === "") {
      const gravatarBlob = await getGravatarBlob(
        userNewData.emails[0]?.email,
        400
      );
      userNewData.background = saveImageBlob(
        gravatarBlob,
        `background-${Date.now()}.jpg`
      );
    }

    const userUpdated = await User.findOneAndUpdate(
      { companyDomain, _id: userId }, // find the user by id
      userNewData,
      { new: true } // updated data
    );

    const updatedUser = await getUserWithUnitsMembers(
      companyDomain,
      userUpdated._id
    );

    if (userNewData.newPassword) {
      updatedUser.newPassword = userNewData.newPassword;
    }

    return res.status(200).json({
      updatedUser,
      message: "Updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  const userId = req.params.id;
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const userId = req.params.id;

    const deleteUser = await User.findByIdAndRemove({
      companyDomain,
      _id: userId,
    });
    if (!deleteUser) {
      return res.status(404).json({ error: "User no found" });
    }
    return res.status(200).json({ message: "User deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const companyDomain = req.headers.origin.split("//")[1];
    const { userId } = req.auth;

    // Update user status to "offline"

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

//Reset password code WEALTH
exports.forgetpassword = CatchErrorFunc(async (req, res, next) => {
  const { email } = req.body;
  const companyDomain = req.headers.origin.split("//")[1];
  const user = await User.findOne({
    email,
    companyDomain,
  });

  if (!user) {
    throw new HandleError(400, "User with this email is not found", 400);
  }

  const settings = await Settings.find({ companyDomain });

  if (settings.length === 0) {
    return res.status(404).json({ message: "Settings not found" });
  }
  const companyName = settings[0].companyDomain;

  const resetToken = user.generatePasswordResetToken();
  await user.save({ ValidateBeforeSave: false });

  const html = `
  <body style="margin: 0; padding: 0; background: #f8f9fb; text-align: center;">
    <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center" valign="middle">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid #ddd;">
    
                    <tr>
                        <td style="font-size: 18px; font-weight: bold; color: #333; padding-bottom: 15px;">
                            Password Reset Request for <strong>${companyName}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555;">Dear <strong>${
                          user.email
                        }</strong>,</td>
                    </tr>
                    <tr>
                        <td style="font-size: 14px; color: #555; padding: 10px 20px;">
                            We received a request to reset your password for your ${companyName} account. 
                            To proceed with resetting your password, please click the link below:
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 0;">
                            <a href="${req.get(
                              "origin"
                            )}/auth/reset-password/${resetToken}" style="display: inline-block; background: black; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                                Reset Password
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #777;">
                            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 12px; color: #777;">
                            If you have any questions or need further assistance, feel free to reach out to our support team.
                        </td>
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
  //const resetUrl = `${req.get("origin")}/auth/reset-password/${resetToken}`;

  // const message =
  //   "Forgot password? click on this link to reset your password " +
  //   resetUrl +
  //   " this link will be valid for only 10min.";

  try {
    await sendMail({
      email: user.email,
      subject: "Reset password",
      //message: message,
      html,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent successfully",
    });
  } catch (error) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined);
    user.save({ ValidateBeforeSave: false });

    res.status(500).json({
      success: false,
      message: "Unable to send mail",
    });
  }
});

exports.reset_password = async (req, res) => {
  //Checking if the user exist with the given token and if the token has expired
  const companyDomain = req.headers.origin.split("//")[1];
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: token,
    companyDomain,
    passwordResetExpires: { $gt: Date.now() },
  }).lean();

  if (!user) {
    return res.status(400).json({ message: "Link is invalid or expired" });
  }

  //  Reseting the user password
  try {
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;

    if (user.confirmPassword !== user.password) {
      return res.status(400).json({ message: "Your passwords do not match" });
    }

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.confirmPassword = undefined;
    user.passwordChangedAt = Date.now();

    const hash = await hashPassword(user.password);
    user.password = hash;

    const userUpdated = await User.findByIdAndUpdate(
      user._id, // find the user by id
      user,
      { new: true } // updated data
    );

    const updatedUser = await getUserWithUnitsMembers(
      companyDomain,
      userUpdated._id
    );

    return res.status(200).json({
      updatedUser,
      message: "Updated successfully!",
    });
  } catch (error) {
    console.error(error)((user.passwordResetToken = undefined)),
      (user.passwordResetExpires = undefined);

    res.status(500).json({
      success: false,
      message: "Unable to reset user password",
    });
    console.log(error);
  }
};

exports.getRandomUserAvatars = async (req, res) => {
  try {
    const getUsers = await User.find().lean();
    if (getUsers.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Shuffle the user array and pick the first 5 users
    const shuffledUsers = getUsers.sort(() => 0.5 - Math.random());
    const avatars = shuffledUsers.slice(0, 5).map((user) => user.avatar);

    return res.status(200).json({ avatars });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.setGuest = async (req, res) => {
  try {
    const staffRole = await Role.findOne({ name: "staff" });
    const users = await User.find({});

    users.forEach(async (user) => {
      user.roleId = staffRole._id;
      if (!user.firstName || !user.lastName) {
        user.firstName = user.displayName;
        user.lastName = user.displayName;
      }
      await user.save();
    });
    return res
      .status(200)
      .json({ message: "Successfully set all users to guest" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.setUserJobPosition = async (req, res) => {
  try {
    const users = await User.find({});
    users.forEach(async (user) => {
      user.jobPosition = null;
      if (!user.firstName || !user.lastName) {
        user.firstName = user.displayName;
        user.lastName = user.displayName;
      }
      await user.save();
    });

    // for (let user of users) {
    //   user.jobPosition = null;
    // }

    return res
      .status(200)
      .json({ message: "Successfully set all users job position to null" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Server error" });
  }
};

exports.createDefaultWeights = async (req, res) => {
  try {
    const defaultWeights = [
      { name: "Task", icon: "#007BFF" },
      { name: "Request", icon: "#6F42C1" },
      { name: "Report", icon: "#6C757D" },
    ];

    // Check which weights are missing
    const existingWeights = await Weight.find({
      name: { $in: defaultWeights.map((w) => w.name) },
    });

    const existingNames = new Set(existingWeights.map((w) => w.name));

    const weightsToInsert = defaultWeights.filter(
      (w) => !existingNames.has(w.name)
    );

    if (weightsToInsert.length > 0) {
      await Weight.insertMany(weightsToInsert);
    }

    return res
      .status(200)
      .json({ message: "Default weights ensured", added: weightsToInsert });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred!" });
  }
};
