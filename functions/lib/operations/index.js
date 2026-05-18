"use strict";
/**
 * Operations Module — Barrel Export
 *
 * Groups all operational Cloud Functions:
 * flight management, inventory, dashboard, sales, pricing, flight status, and geo.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiAssistant = exports.geolocate = exports.checkFlightStatus = exports.forecastRevenueSecure = exports.calculateDynamicPriceSecure = exports.aggregateDailySales = exports.getDashboardStats = exports.withdrawFlight = exports.publishSchedule = exports.swapAircraft = exports.assignGate = exports.updateFlightStatus = void 0;
var flights_1 = require("../flights");
Object.defineProperty(exports, "updateFlightStatus", { enumerable: true, get: function () { return flights_1.updateFlightStatus; } });
Object.defineProperty(exports, "assignGate", { enumerable: true, get: function () { return flights_1.assignGate; } });
Object.defineProperty(exports, "swapAircraft", { enumerable: true, get: function () { return flights_1.swapAircraft; } });
var inventory_1 = require("../inventory");
Object.defineProperty(exports, "publishSchedule", { enumerable: true, get: function () { return inventory_1.publishSchedule; } });
Object.defineProperty(exports, "withdrawFlight", { enumerable: true, get: function () { return inventory_1.withdrawFlight; } });
var dashboard_1 = require("../dashboard");
Object.defineProperty(exports, "getDashboardStats", { enumerable: true, get: function () { return dashboard_1.getDashboardStats; } });
var sales_1 = require("../sales");
Object.defineProperty(exports, "aggregateDailySales", { enumerable: true, get: function () { return sales_1.aggregateDailySales; } });
var pricing_1 = require("../pricing");
Object.defineProperty(exports, "calculateDynamicPriceSecure", { enumerable: true, get: function () { return pricing_1.calculateDynamicPriceSecure; } });
Object.defineProperty(exports, "forecastRevenueSecure", { enumerable: true, get: function () { return pricing_1.forecastRevenueSecure; } });
var flightStatus_1 = require("../flightStatus");
Object.defineProperty(exports, "checkFlightStatus", { enumerable: true, get: function () { return flightStatus_1.checkFlightStatus; } });
var geolocate_1 = require("../geolocate");
Object.defineProperty(exports, "geolocate", { enumerable: true, get: function () { return geolocate_1.geolocate; } });
var gemini_1 = require("../gemini");
Object.defineProperty(exports, "geminiAssistant", { enumerable: true, get: function () { return gemini_1.geminiAssistant; } });
//# sourceMappingURL=index.js.map