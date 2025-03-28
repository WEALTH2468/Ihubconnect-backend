// category, challenge, goal, objective, period, risk, task, attachmentType, attendant, chat, comment, counter, customer, readReceipt, document, item
// jobPosition, message, notification, post, user, quote, setting, team, teammate, tempUser, unsentNotification, weight
const models = {
  Category: require("../models/iperformance/category"),
  Challenge: require("../models/iperformance/challenge"),
  Goal: require("../modules/iperformance/goal/goal.model"),
  Objective: require("../modules/iperformance/objective/objective.model"),
  Period: require("../models/iperformance/period"),
  Risk: require("../models/iperformance/risk"),
  Task: require("../modules/iperformance/task/task.model"),
  Counter: require("../models/counter"),
  Customer: require("../models/customer"),
  Item: require("../models/item"),
  JobPosition: require("../models/jobPosition"),
  Quote: require("../models/quote"),
  Weight: require("../models/weight"),
  AttachmentType: require("../models/attachmentType"),
  Attendant: require("../models/attendant"),
  User: require("../models/user"),
  Document: require("../models/document"),
  Setting: require("../models/settings"),
  Team: require("../models/team"),
  Teammate: require("../models/teammate"),
  UnsentNotification: require("../models/unsentNotification"),
  TempUser: require("../models/tempUser"),
  Chat: require("../models/chat"),
  ReadReceipt: require("../models/readReceipt"),
  Document: require("../models/document"),
  Message: require("../models/message"),
  Notification: require("../models/notification"),
  Post: require("../models/post"),
};
const permissions = require("../lib/permissions.json");
const Role = require("../models/rbac/role");

exports.moveData = async (req, res) => {
  try {
    for (const modelName in models) {
      const Model = models[modelName];
      await Model.updateMany(
        {},
        { $set: { companyDomain: "mudiame.ihubconnect.com" } }
      );
      console.log(`Updated ${modelName}`);
    }

    return res.status(200).json({ message: "Models successfully updated" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPermissions = async (req, res) => {
  try {
    // employee
    const employeePermissions = permissions.employeePermissions;

    const employeeRole = await Role.findOne({ name: "staff" });
    employeeRole.permissions = JSON.stringify(employeePermissions);

    employeeRole.save();

    // team lead
    const teamLeadPermissions = permissions.teamLeadPermissions;

    const teamLeadRole = await Role.findOne({ name: "team lead" });
    teamLeadRole.permissions = JSON.stringify(teamLeadPermissions);

    teamLeadRole.save();

    // manager
    const managerPermissions = permissions.managerPermissions;

    const managerRole = await Role.findOne({ name: "manager" });
    managerRole.permissions = JSON.stringify(managerPermissions);

    managerRole.save();

    // admin
    const adminPermissions = permissions.adminPermissions;

    const adminRole = await Role.findOne({ name: "admin" });
    adminRole.permissions = JSON.stringify(adminPermissions);

    adminRole.save();

    // super admin
    const superAdminPermissions = permissions.superAdminPermissions;

    const superAdminRole = await Role.findOne({ name: "super admin" });
    superAdminRole.permissions = JSON.stringify(superAdminPermissions);

    superAdminRole.save();

    return res.status(200).json({ message: "Permissions resetted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
