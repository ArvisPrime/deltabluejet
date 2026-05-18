"use strict";
/**
 * Loyalty Module — Barrel Export
 *
 * Groups all loyalty program Cloud Functions:
 * automatic enrollment, point accrual, refund clawback, redemption, and award bookings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAwardBookingSecure = exports.redeemPointsSecure = exports.onBookingRefundedLoyalty = exports.onBookingConfirmedLoyalty = exports.onUserCreatedLoyalty = void 0;
var loyalty_1 = require("../loyalty");
Object.defineProperty(exports, "onUserCreatedLoyalty", { enumerable: true, get: function () { return loyalty_1.onUserCreatedLoyalty; } });
Object.defineProperty(exports, "onBookingConfirmedLoyalty", { enumerable: true, get: function () { return loyalty_1.onBookingConfirmedLoyalty; } });
Object.defineProperty(exports, "onBookingRefundedLoyalty", { enumerable: true, get: function () { return loyalty_1.onBookingRefundedLoyalty; } });
Object.defineProperty(exports, "redeemPointsSecure", { enumerable: true, get: function () { return loyalty_1.redeemPointsSecure; } });
Object.defineProperty(exports, "createAwardBookingSecure", { enumerable: true, get: function () { return loyalty_1.createAwardBookingSecure; } });
//# sourceMappingURL=index.js.map