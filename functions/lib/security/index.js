"use strict";
/**
 * Security Module — Barrel Export
 *
 * Groups all security-related Cloud Functions:
 * WebAuthn (registration, authentication, key management),
 * TOTP (setup, verification, removal), and voucher management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemVoucherSecure = exports.createVoucherSecure = exports.clearTotpVerified = exports.totpGetStatus = exports.totpRemove = exports.totpVerifyCode = exports.totpVerifySetup = exports.totpGenerateSecret = exports.resetYubikeyRegistration = exports.getSecurityKeyStatus = exports.assignSecurityKeyRequirement = exports.clearYubikeyVerified = exports.webauthnRemoveKey = exports.webauthnListKeys = exports.webauthnVerifyAuthentication = exports.webauthnGenerateAuthentication = exports.webauthnVerifyRegistration = exports.webauthnGenerateRegistration = void 0;
var webauthn_1 = require("../webauthn");
Object.defineProperty(exports, "webauthnGenerateRegistration", { enumerable: true, get: function () { return webauthn_1.webauthnGenerateRegistration; } });
Object.defineProperty(exports, "webauthnVerifyRegistration", { enumerable: true, get: function () { return webauthn_1.webauthnVerifyRegistration; } });
Object.defineProperty(exports, "webauthnGenerateAuthentication", { enumerable: true, get: function () { return webauthn_1.webauthnGenerateAuthentication; } });
Object.defineProperty(exports, "webauthnVerifyAuthentication", { enumerable: true, get: function () { return webauthn_1.webauthnVerifyAuthentication; } });
Object.defineProperty(exports, "webauthnListKeys", { enumerable: true, get: function () { return webauthn_1.webauthnListKeys; } });
Object.defineProperty(exports, "webauthnRemoveKey", { enumerable: true, get: function () { return webauthn_1.webauthnRemoveKey; } });
Object.defineProperty(exports, "clearYubikeyVerified", { enumerable: true, get: function () { return webauthn_1.clearYubikeyVerified; } });
Object.defineProperty(exports, "assignSecurityKeyRequirement", { enumerable: true, get: function () { return webauthn_1.assignSecurityKeyRequirement; } });
Object.defineProperty(exports, "getSecurityKeyStatus", { enumerable: true, get: function () { return webauthn_1.getSecurityKeyStatus; } });
Object.defineProperty(exports, "resetYubikeyRegistration", { enumerable: true, get: function () { return webauthn_1.resetYubikeyRegistration; } });
var totp_1 = require("../totp");
Object.defineProperty(exports, "totpGenerateSecret", { enumerable: true, get: function () { return totp_1.totpGenerateSecret; } });
Object.defineProperty(exports, "totpVerifySetup", { enumerable: true, get: function () { return totp_1.totpVerifySetup; } });
Object.defineProperty(exports, "totpVerifyCode", { enumerable: true, get: function () { return totp_1.totpVerifyCode; } });
Object.defineProperty(exports, "totpRemove", { enumerable: true, get: function () { return totp_1.totpRemove; } });
Object.defineProperty(exports, "totpGetStatus", { enumerable: true, get: function () { return totp_1.totpGetStatus; } });
Object.defineProperty(exports, "clearTotpVerified", { enumerable: true, get: function () { return totp_1.clearTotpVerified; } });
var vouchers_1 = require("../vouchers");
Object.defineProperty(exports, "createVoucherSecure", { enumerable: true, get: function () { return vouchers_1.createVoucherSecure; } });
Object.defineProperty(exports, "redeemVoucherSecure", { enumerable: true, get: function () { return vouchers_1.redeemVoucherSecure; } });
//# sourceMappingURL=index.js.map