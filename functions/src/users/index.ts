/**
 * Users Module — Barrel Export
 *
 * Groups all user management Cloud Functions:
 * role assignment, account creation/deletion, claims sync.
 */

export {
    setUserRole,
    onUserCreated,
    createUserAccount,
    disableUserAccount,
    deleteUserAccount,
    syncAllClaims,
} from '../users';
