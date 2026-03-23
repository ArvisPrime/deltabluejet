/**
 * Route path constants for the application.
 * Organized by feature area matching the src/features/ directory structure.
 */
export const ROUTES = {
    // Public
    HOME: '/',
    DESTINATIONS: '/destinations',
    DESTINATION_DETAIL: '/destinations/:id',
    ABOUT: '/about',
    CAREERS: '/careers',

    // Legal
    TERMS: '/terms',
    PRIVACY_POLICY: '/privacy',
    DANGEROUS_GOODS: '/dangerous-goods',
    TARMAC_DELAY_PLAN: '/tarmac-delay-plan',
    VISA_CHECKER: '/visa-requirements',

    // Booking — Cancel
    CANCEL_BOOKING: '/manage-booking/:pnr/cancel',

    // Auth
    LOGIN: '/login',
    STAFF_LOGIN: '/staff-login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    CREATE_NEW_PASSWORD: '/reset-password',
    RESET_SUCCESSFUL: '/reset-success',

    // Booking flow
    FLIGHT_SEARCH: '/book',
    FLIGHT_RESULTS: '/book/results',
    FARE_SELECTION: '/book/fare',
    PASSENGER_DETAILS: '/book/passengers',
    SEAT_SELECTION: '/book/seats',
    BAGGAGE_SELECTION: '/book/baggage',
    PAYMENT: '/book/payment',
    PAYMENT_CALLBACK: '/booking/payment-callback',
    TICKET_CONFIRMATION: '/book/confirmation',
    MULTI_CITY: '/book/multi-city',

    // Manage booking
    MANAGE_BOOKING: '/manage-booking',
    BAGGAGE_TRACKING: '/manage-booking/baggage',
    BOOKING_DETAIL: '/manage-booking/:pnr',
    MODIFY_BOOKING: '/manage-booking/:pnr/modify',
    REVIEW_CHANGE: '/manage-booking/:pnr/review-change',
    CHANGE_SUCCESS: '/manage-booking/:pnr/change-success',

    // Group booking (public)
    GROUP_BOOKING: '/group-booking',

    // Check-in flow
    CHECKIN: '/checkin',
    CHECKIN_PASSENGERS: '/checkin/passengers',
    CHECKIN_DECLARATION: '/checkin/declaration',
    CHECKIN_SEATS: '/checkin/seats',
    CHECKIN_SUCCESS: '/checkin/success',

    // Flight tracker
    FLIGHT_TRACKER: '/flight-status',
    FLIGHT_TRACKER_RESULTS: '/flight-status/results',

    // Loyalty
    LOYALTY: '/loyalty',
    LOYALTY_REDEMPTION: '/loyalty/redeem',

    // Passenger Portal
    MY_DASHBOARD: '/my',
    MY_PROFILE: '/my/profile',
    MY_TRIPS: '/my/trips',

    // Admin — Dashboard
    DASHBOARD: '/admin',
    SALES_DASHBOARD: '/admin/sales',
    PRICING_RULES: '/admin/pricing',

    // Admin — Flights & Ops
    FLEET_MANAGEMENT: '/admin/fleet',
    FLIGHT_SCHEDULING: '/admin/scheduling',
    GATE_ASSIGNMENT: '/admin/gates',
    MANAGE_DELAY: '/admin/delays',
    DISRUPTION_RESOLUTION: '/admin/disruptions',
    AIRCRAFT_SWAP: '/admin/aircraft-swap',
    REGULATORY_MANIFEST: '/admin/manifest',
    OPERATIONAL_TRIGGERS: '/admin/triggers',
    ALERT_AUDIT_LOG: '/admin/alerts',
    SEAT_MAP_CMS: '/admin/seat-map',
    ROUTE_MANAGEMENT: '/admin/routes',
    AIRPORT_MANAGEMENT: '/admin/airports',

    // Admin — Users
    USER_MANAGEMENT: '/admin/users',
    ACCOUNT_SETTINGS: '/admin/account',
    NOTIFICATION_PREFERENCES: '/admin/notifications',

    // Admin — Bookings
    BOOKINGS: '/admin/bookings',
    BOOKING_DETAIL_ADMIN: '/admin/bookings/:id',
    TICKET_REISSUE: '/admin/ticket-reissue',

    // Admin — CMS
    LANDING_PAGE_EDITOR: '/admin/cms/landing',
    PAGE_EDITOR: '/admin/cms/pages',
    HEADER_MANAGEMENT: '/admin/cms/header',
    FOOTER_MANAGEMENT: '/admin/cms/footer',
    MENU_MANAGEMENT: '/admin/cms/menu',
    FAVICON_SEO: '/admin/cms/seo',
    ABOUT_VALUES_CMS: '/admin/cms/about-values',
    DESTINATIONS_CMS: '/admin/cms/destinations',

    // Admin — Security
    SESSION_MONITOR: '/admin/security/sessions',
    SESSION_AUDIT_LOG: '/admin/security/session-audit',
    MFA_SETTINGS: '/admin/security/mfa',
    SSO_SETTINGS: '/admin/security/sso',
    PASSWORD_POLICY: '/admin/security/password-policy',
    SECURITY_KEYS: '/admin/security/keys',
    YUBIKEY_VERIFY: '/admin/verify-key',

    // Admin — Communications
    EMAIL_TEMPLATES: '/admin/comms/email',
    EMAIL_AUDIT_LOG: '/admin/comms/email-audit',
    SMS_CONFIGURATION: '/admin/comms/sms',
    SMS_AUDIT_LOG: '/admin/comms/sms-audit',

    // Admin — Experiments
    EXPERIMENTS_DASHBOARD: '/admin/experiments',
    EXPERIMENTS_AUDIT_LOG: '/admin/experiments/audit',

    // Admin — Loyalty
    LOYALTY_ADMIN: '/admin/loyalty',

    // Admin — Ancillary Revenue
    ANCILLARY_ADMIN: '/admin/ancillary',
    BAGGAGE_ADMIN: '/admin/baggage',

    // Admin — Crew
    CREW_MANAGEMENT: '/admin/crew',
    CREW_SCHEDULING: '/admin/crew/scheduling',

    // Admin — IROP & Revenue
    MASS_REBOOKING: '/admin/mass-rebooking',
    OVERBOOKING: '/admin/overbooking',
    CORPORATE_FARES: '/admin/corporate-fares',

    // Support
    HELP_CENTER: '/help',
    SUPPORT_TICKETS: '/support/tickets',
    CALLBACK_REQUEST: '/support/callback',

    // Admin — Support
    COMPLAINT_MANAGEMENT: '/admin/complaints',

    // Booking — Special Assistance
    SPECIAL_ASSISTANCE: '/special-assistance',

    // Destinations — Health
    HEALTH_REQUIREMENTS: '/health-requirements',

    // Legal — Accessibility
    ACCESSIBILITY_STATEMENT: '/accessibility',

    // ─── Phase 4: Growth & Alliance ───────────────────────────

    // Loyalty v2
    TIER_BENEFITS: '/loyalty/benefits',
    AWARD_BOOKING: '/book/award',
    MILES_CASH: '/book/miles-cash',
    FAMILY_POOLING: '/loyalty/family',
    STATUS_MATCH: '/loyalty/status-match',

    // Interline & Codeshare
    CODESHARE_FLIGHTS: '/codeshare',
    INTERLINE_ADMIN: '/admin/interline',

    // Reporting & BI
    REVENUE_REPORTS: '/admin/reports/revenue',
    LOAD_FACTOR_REPORTS: '/admin/reports/load-factor',
    OTP_REPORTS: '/admin/reports/otp',
    PASSENGER_STATS: '/admin/reports/passengers',
    FINANCIAL_RECONCILIATION: '/admin/reports/finance',
} as const;
