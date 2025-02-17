const Role = require("../../models/rbac/role");
const Permission = require("../../models/rbac/permission");
const permissionsJson = require("../permissions.json");


async function createDefaultRolesIfAbsent() {
  const roles = await Role.find({});
  if (roles.length === 0) {
    console.log("Creating default roles...");

    const superAdminRole = new Role({
      name: "super admin",
      description: "Super Admin Role",
      permissions: JSON.stringify(permissionsJson.superAdminPermissions),
    });
    const adminRole = new Role({
      name: "admin",
      description: "Admin Role",
      permissions: JSON.stringify(permissionsJson.adminPermissions),
    });
    const managerRole = new Role({
      name: "manager",
      description: "Manager Role",
      permissions: JSON.stringify([
        ...permissionsJson.generalPermissions,
        ...permissionsJson.employeePermissions,
        ...permissionsJson.teamLeadPermissions,
        ...permissionsJson.managerPermissions
      ]),
    });
    const teamLeadRole = new Role({
      name: "team lead",
      description: "Team Lead Role",
      permissions: JSON.stringify([
        ...permissionsJson.generalPermissions,
        ...permissionsJson.employeePermissions,
        ...permissionsJson.teamLeadPermissions
      ]),
    });
    const staffRole = new Role({
      name: "staff",
      description: "Staff Role",
      permissions: JSON.stringify([
        ...permissionsJson.generalPermissions,
        ...permissionsJson.employeePermissions
      ]),
    });
    const guestRole = new Role({
      name: "guest",
      description: "Guest Role",
    });
    const customerRole = new Role({
      name: "customer",
      description: "Customer Role",
      permissions: JSON.stringify(permissionsJson.generalPermissions),
    });
    await superAdminRole.save();
    await managerRole.save();
    await adminRole.save();
    await teamLeadRole.save();
    await staffRole.save();
    await guestRole.save();
    await customerRole.save();
  }
}

module.exports = { createDefaultRolesIfAbsent };
