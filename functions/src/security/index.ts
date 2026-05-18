/**
 * Security Module — Barrel Export
 *
 * Groups all security-related Cloud Functions:
 * WebAuthn (registration, authentication, key management),
 * TOTP (setup, verification, removal), and voucher management.
 */

export {
    webauthnGenerateRegistration,
    webauthnVerifyRegistration,
    webauthnGenerateAuthentication,
    webauthnVerifyAuthentication,
    webauthnListKeys,
    webauthnRemoveKey,
    clearYubikeyVerified,
    assignSecurityKeyRequirement,
    getSecurityKeyStatus,
    resetYubikeyRegistration,
} from '../webauthn';

export {
    totpGenerateSecret,
    totpVerifySetup,
    totpVerifyCode,
    totpRemove,
    totpGetStatus,
    clearTotpVerified,
} from '../totp';

export { createVoucherSecure, redeemVoucherSecure } from '../vouchers';
