"use strict";
/**
 * Users Module — Barrel Export
 *
 * Groups all user management Cloud Functions:
 * role assignment, account creation/deletion, claims sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAllClaims = exports.deleteUserAccount = exports.disableUserAccount = exports.createUserAccount = exports.onUserCreated = exports.setUserRole = void 0;
var users_1 = require("../users");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return users_1.setUserRole; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return users_1.onUserCreated; } });
Object.defineProperty(exports, "createUserAccount", { enumerable: true, get: function () { return users_1.createUserAccount; } });
Object.defineProperty(exports, "disableUserAccount", { enumerable: true, get: function () { return users_1.disableUserAccount; } });
Object.defineProperty(exports, "deleteUserAccount", { enumerable: true, get: function () { return users_1.deleteUserAccount; } });
Object.defineProperty(exports, "syncAllClaims", { enumerable: true, get: function () { return users_1.syncAllClaims; } });
//# sourceMappingURL=index.js.map