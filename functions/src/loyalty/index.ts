/**
 * Loyalty Module — Barrel Export
 *
 * Groups all loyalty program Cloud Functions:
 * automatic enrollment, point accrual, refund clawback, redemption, and award bookings.
 */

export {
    onUserCreatedLoyalty,
    onBookingConfirmedLoyalty,
    onBookingRefundedLoyalty,
    redeemPointsSecure,
    createAwardBookingSecure,
} from '../loyalty';
