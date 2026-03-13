const fs = require("fs");
const config = require("./config");

function loadUsers() {
  try {
    const data = fs.readFileSync(config.usersFile, "utf8");
    return JSON.parse(data).users || [];
  } catch (err) {
    console.warn(`[UserManager] Cannot load users file: ${err.message}`);
    return [];
  }
}

function createUserManager() {
  const users = loadUsers();

  return {
    isValidUser(userName, password) {
      const user = users.find((u) => u.username === userName);
      if (!user) return false;
      return user.password === password;
    },

    getUserRoles(userName) {
      const user = users.find((u) => u.username === userName);
      if (!user) return [];
      switch (user.role) {
        case "admin":
          return ["AuthenticatedUser", "ConfigureAdmin", "SecurityAdmin", "Operator", "Engineer"];
        case "operator":
          return ["AuthenticatedUser", "Operator"];
        case "viewer":
          return ["AuthenticatedUser"];
        default:
          return ["AuthenticatedUser"];
      }
    },
  };
}

module.exports = { createUserManager };
