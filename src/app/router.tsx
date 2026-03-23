import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { ROUTES } from '../config/routes';
import ProtectedRoute from '../components/common/ProtectedRoute';
import NotFound from '../components/common/NotFound';
import RouteErrorPage from '../components/common/RouteErrorPage';

/**
 * Lazy import with auto-retry — handles stale chunk hashes after deploys.
 * Tries the import, and if it fails, reloads once to get fresh chunk names.
 */
function lazyRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
    return lazy(() =>
        factory().catch(() => {
            // Retry once by cache-busting the page
            const reloaded = sessionStorage.getItem('__db_lazy_retry');
            if (!reloaded) {
                sessionStorage.setItem('__db_lazy_retry', '1');
                window.location.reload();
                // Return a never-resolving promise to prevent rendering while reloading
                return new Promise(() => { });
            }
            sessionStorage.removeItem('__db_lazy_retry');
            // If retry also failed, re-throw so ErrorBoundary catches it
            return factory();
        }),
    );
}

const PublicLayout = lazyRetry(() => import('../components/layout/PublicLayout'));
const AdminLayout = lazyRetry(() => import('../components/layout/AdminLayout'));

// Lazy-load all feature pages for code splitting
// --- Destinations / Public ---
const LandingHome = lazyRetry(() => import('../features/destinations/LandingHome'));
const Destinations = lazyRetry(() => import('../features/destinations/Destinations'));
const DestinationDetail = lazyRetry(() => import('../features/destinations/DestinationDetail'));
const AboutUs = lazyRetry(() => import('../features/about/AboutUs'));
const Careers = lazyRetry(() => import('../features/careers/Careers'));

// --- Legal ---
const TermsAndConditions = lazyRetry(() => import('../features/legal/TermsAndConditions'));
const PrivacyPolicy = lazyRetry(() => import('../features/legal/PrivacyPolicy'));
const DangerousGoods = lazyRetry(() => import('../features/legal/DangerousGoods'));
const TarmacDelayPlan = lazyRetry(() => import('../features/legal/TarmacDelayPlan'));
const VisaChecker = lazyRetry(() => import('../features/legal/VisaChecker'));

// --- Booking (extended) ---
const CancelBooking = lazyRetry(() => import('../features/booking/CancelBooking'));
const BaggageSelection = lazyRetry(() => import('../features/booking/BaggageSelection'));
const BaggageTracking = lazyRetry(() => import('../features/booking/BaggageTracking'));
const GroupBooking = lazyRetry(() => import('../features/booking/GroupBooking'));

// --- Auth ---
const Login = lazyRetry(() => import('../features/auth/Login'));
const StaffLogin = lazyRetry(() => import('../features/auth/StaffLogin'));
const Register = lazyRetry(() => import('../features/auth/Register'));
const ForgotPassword = lazyRetry(() => import('../features/auth/ForgotPassword'));
const CreateNewPassword = lazyRetry(() => import('../features/auth/CreateNewPassword'));
const ResetSuccessful = lazyRetry(() => import('../features/auth/ResetSuccessful'));

// --- Booking ---
const FlightSearch = lazyRetry(() => import('../features/booking/FlightSearch'));
const FlightResults = lazyRetry(() => import('../features/booking/FlightResults'));
const FareClassSelection = lazyRetry(() => import('../features/booking/FareClassSelection'));
const PassengerDetails = lazyRetry(() => import('../features/booking/PassengerDetails'));
const SeatSelection = lazyRetry(() => import('../features/booking/SeatSelection'));
const PaymentProcessing = lazyRetry(() => import('../features/booking/PaymentProcessing'));
const PaymentCallback = lazyRetry(() => import('../features/booking/PaymentCallback'));
const TicketConfirmation = lazyRetry(() => import('../features/booking/TicketConfirmation'));
const ManageBookingRetrieval = lazyRetry(() => import('../features/booking/ManageBookingRetrieval'));
const BookingDetail = lazyRetry(() => import('../features/booking/BookingDetail'));
const ModifyBookingSearch = lazyRetry(() => import('../features/booking/ModifyBookingSearch'));
const ReviewFlightChange = lazyRetry(() => import('../features/booking/ReviewFlightChange'));
const FlightChangeSuccess = lazyRetry(() => import('../features/booking/FlightChangeSuccess'));
const Bookings = lazyRetry(() => import('../features/booking/Bookings'));
const TicketReissue = lazyRetry(() => import('../features/booking/TicketReissue'));
const BookingDetailAdmin = lazyRetry(() => import('../features/booking/BookingDetailAdmin'));
const MultiCitySearch = lazyRetry(() => import('../features/booking/MultiCitySearch'));

// --- Check-in ---
const CheckinRetrieval = lazyRetry(() => import('../features/checkin/CheckinRetrieval'));
const CheckinPassengers = lazyRetry(() => import('../features/checkin/CheckinPassengers'));
const CheckinDeclaration = lazyRetry(() => import('../features/checkin/CheckinDeclaration'));
const CheckinSeats = lazyRetry(() => import('../features/checkin/CheckinSeats'));
const CheckinSuccess = lazyRetry(() => import('../features/checkin/CheckinSuccess'));

// --- Flight Tracker ---
const FlightTrackerSearch = lazyRetry(() => import('../features/flights/FlightTrackerSearch'));
const FlightTrackerResults = lazyRetry(() => import('../features/flights/FlightTrackerResults'));

// --- Loyalty ---
const LoyaltyDashboard = lazyRetry(() => import('../features/users/LoyaltyDashboard'));
const LoyaltyRedemption = lazyRetry(() => import('../features/users/LoyaltyRedemption'));

// --- Passenger Portal ---
const PassengerLayout = lazyRetry(() => import('../components/layout/PassengerLayout'));
const MyDashboard = lazyRetry(() => import('../features/passenger/MyDashboard'));
const MyProfile = lazyRetry(() => import('../features/passenger/MyProfile'));
const MyTrips = lazyRetry(() => import('../features/passenger/MyTrips'));

// --- Dashboard ---
const Dashboard = lazyRetry(() => import('../features/dashboard/Dashboard'));
const SalesDashboard = lazyRetry(() => import('../features/dashboard/SalesDashboard'));
const PricingRulesAdmin = lazyRetry(() => import('../features/dashboard/PricingRulesAdmin'));

// --- Flights & Ops ---
const FleetManagement = lazyRetry(() => import('../features/flights/FleetManagement'));
const FlightScheduling = lazyRetry(() => import('../features/flights/FlightScheduling'));
const GateAssignment = lazyRetry(() => import('../features/operations/GateAssignment'));
const ManageDelay = lazyRetry(() => import('../features/operations/ManageDelay'));
const DisruptionResolution = lazyRetry(() => import('../features/operations/DisruptionResolution'));
const AircraftSwap = lazyRetry(() => import('../features/operations/AircraftSwap'));
const RegulatoryManifest = lazyRetry(() => import('../features/operations/RegulatoryManifest'));
const OperationalTriggers = lazyRetry(() => import('../features/operations/OperationalTriggers'));
const AlertAuditLog = lazyRetry(() => import('../features/operations/AlertAuditLog'));
const SeatMapCMS = lazyRetry(() => import('../features/operations/SeatMapCMS'));
const RouteManagement = lazyRetry(() => import('../features/operations/RouteManagement'));
const AirportManagement = lazyRetry(() => import('../features/operations/AirportManagement'));

// --- Users ---
const UserManagement = lazyRetry(() => import('../features/users/UserManagement'));
const AccountSettings = lazyRetry(() => import('../features/users/AccountSettings'));
const NotificationPreferences = lazyRetry(() => import('../features/users/NotificationPreferences'));

// --- CMS ---
const LandingPageEditor = lazyRetry(() => import('../features/cms/LandingPageEditor'));
const PageEditor = lazyRetry(() => import('../features/cms/PageEditor'));
const HeaderManagement = lazyRetry(() => import('../features/cms/HeaderManagement'));
const FooterManagement = lazyRetry(() => import('../features/cms/FooterManagement'));
const MenuManagement = lazyRetry(() => import('../features/cms/MenuManagement'));
const FaviconSEOAuditLog = lazyRetry(() => import('../features/cms/FaviconSEOAuditLog'));
const AboutValuesManagement = lazyRetry(() => import('../features/cms/AboutValuesManagement'));
const DestinationsCMS = lazyRetry(() => import('../features/cms/DestinationsCMS'));

// --- Security ---
const SessionMonitor = lazyRetry(() => import('../features/security/SessionMonitor'));
const SessionAuditLog = lazyRetry(() => import('../features/security/SessionAuditLog'));
const MFASettings = lazyRetry(() => import('../features/security/MFASettings'));
const SSOSettings = lazyRetry(() => import('../features/security/SSOSettings'));
const PasswordPolicy = lazyRetry(() => import('../features/security/PasswordPolicy'));
const SecurityKeySetup = lazyRetry(() => import('../features/security/SecurityKeySetup'));
const YubiKeyVerify = lazyRetry(() => import('../features/security/YubiKeyVerify'));

// --- Communications ---
const EmailTemplatesCMS = lazyRetry(() => import('../features/communications/EmailTemplatesCMS'));
const EmailAuditLog = lazyRetry(() => import('../features/communications/EmailAuditLog'));
const SMSConfiguration = lazyRetry(() => import('../features/communications/SMSConfiguration'));
const SMSAuditLog = lazyRetry(() => import('../features/communications/SMSAuditLog'));

// --- Experiments ---
const ExperimentsDashboard = lazyRetry(() => import('../features/experiments/ExperimentsDashboard'));
const ExperimentsAuditLog = lazyRetry(() => import('../features/experiments/ExperimentsAuditLog'));

// --- Phase 4: Loyalty Admin, Ancillary, Crew ---
const LoyaltyAdmin = lazyRetry(() => import('../features/dashboard/LoyaltyAdmin'));
const AncillaryAdmin = lazyRetry(() => import('../features/dashboard/AncillaryAdmin'));
const BaggageAdmin = lazyRetry(() => import('../features/dashboard/BaggageAdmin'));
const CrewManagement = lazyRetry(() => import('../features/operations/CrewManagement'));
const CrewScheduling = lazyRetry(() => import('../features/operations/CrewScheduling'));

// --- Phase 3D: IROP & Revenue ---
const MassRebooking = lazyRetry(() => import('../features/operations/MassRebooking'));
const OverbookingManager = lazyRetry(() => import('../features/operations/OverbookingManager'));
const CorporateFares = lazyRetry(() => import('../features/dashboard/CorporateFares'));

// --- Phase 3E: Customer Experience & Mobile ---
const HelpCenter = lazyRetry(() => import('../features/support/HelpCenter'));
const SupportTickets = lazyRetry(() => import('../features/support/SupportTickets'));
const CallbackRequest = lazyRetry(() => import('../features/support/CallbackRequest'));
const ComplaintManagement = lazyRetry(() => import('../features/dashboard/ComplaintManagement'));
const SpecialAssistance = lazyRetry(() => import('../features/booking/SpecialAssistance'));
const HealthRequirements = lazyRetry(() => import('../features/destinations/HealthRequirements'));
const AccessibilityStatement = lazyRetry(() => import('../features/legal/AccessibilityStatement'));

// --- Phase 4: Growth & Alliance ---
const TierBenefits = lazyRetry(() => import('../features/users/TierBenefits'));
const AwardBooking = lazyRetry(() => import('../features/booking/AwardBooking'));
const MilesCashPayment = lazyRetry(() => import('../features/booking/MilesCashPayment'));
const FamilyPooling = lazyRetry(() => import('../features/users/FamilyPooling'));
const StatusMatch = lazyRetry(() => import('../features/users/StatusMatch'));
const CodeshareFlights = lazyRetry(() => import('../features/flights/CodeshareFlights'));
const InterlineAdmin = lazyRetry(() => import('../features/dashboard/InterlineAdmin'));
const RevenueReports = lazyRetry(() => import('../features/dashboard/RevenueReports'));
const LoadFactorReports = lazyRetry(() => import('../features/dashboard/LoadFactorReports'));
const OTPReports = lazyRetry(() => import('../features/dashboard/OTPReports'));
const PassengerStats = lazyRetry(() => import('../features/dashboard/PassengerStats'));
const FinancialReconciliation = lazyRetry(() => import('../features/dashboard/FinancialReconciliation'));


/**
 * Loading fallback for lazy-loaded pages.
 */
const PageLoader: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-navy-400 font-display text-xs uppercase tracking-[0.3em]">Loading</p>
        </div>
    </div>
);

const withSuspense = (Component: React.ComponentType<any>) => (
    <Suspense fallback={<PageLoader />}>
        <Component />
    </Suspense>
);

/** Wrap a component with ProtectedRoute + Suspense */
const withAuth = (Component: React.ComponentType<any>, allowedRoles?: AuthRole[]) => (
    <Suspense fallback={<PageLoader />}>
        <ProtectedRoute allowedRoles={allowedRoles}>
            <Component />
        </ProtectedRoute>
    </Suspense>
);

type AuthRole = 'super_admin' | 'ops_manager' | 'crew_sched' | 'cs_agent' | 'customer';
const OPS_ROLES: AuthRole[] = ['super_admin', 'ops_manager', 'crew_sched', 'cs_agent'];

export const router = createBrowserRouter([
    // ═══ PUBLIC ROUTES (wrapped in PublicLayout) ═══════════════
    {
        element: withSuspense(PublicLayout),
        errorElement: <RouteErrorPage />,
        children: [
            // --- Home & Destinations ---
            { path: ROUTES.HOME, element: withSuspense(LandingHome) },
            { path: ROUTES.DESTINATIONS, element: withSuspense(Destinations) },
            { path: ROUTES.DESTINATION_DETAIL, element: withSuspense(DestinationDetail) },
            { path: ROUTES.ABOUT, element: withSuspense(AboutUs) },
            { path: ROUTES.CAREERS, element: withSuspense(Careers) },

            // --- Legal ---
            { path: ROUTES.TERMS, element: withSuspense(TermsAndConditions) },
            { path: ROUTES.PRIVACY_POLICY, element: withSuspense(PrivacyPolicy) },
            { path: ROUTES.DANGEROUS_GOODS, element: withSuspense(DangerousGoods) },
            { path: ROUTES.TARMAC_DELAY_PLAN, element: withSuspense(TarmacDelayPlan) },
            { path: ROUTES.VISA_CHECKER, element: withSuspense(VisaChecker) },

            // --- Booking Flow ---
            { path: ROUTES.FLIGHT_SEARCH, element: withSuspense(FlightSearch) },
            { path: ROUTES.FLIGHT_RESULTS, element: withSuspense(FlightResults) },
            { path: ROUTES.FARE_SELECTION, element: withSuspense(FareClassSelection) },
            { path: ROUTES.PASSENGER_DETAILS, element: withSuspense(PassengerDetails) },
            { path: ROUTES.SEAT_SELECTION, element: withSuspense(SeatSelection) },
            { path: ROUTES.BAGGAGE_SELECTION, element: withSuspense(BaggageSelection) },
            { path: ROUTES.PAYMENT, element: withSuspense(PaymentProcessing) },
            { path: ROUTES.PAYMENT_CALLBACK, element: withSuspense(PaymentCallback) },
            { path: ROUTES.TICKET_CONFIRMATION, element: withSuspense(TicketConfirmation) },
            { path: ROUTES.MULTI_CITY, element: withSuspense(MultiCitySearch) },

            // --- Manage Booking ---
            { path: ROUTES.MANAGE_BOOKING, element: withSuspense(ManageBookingRetrieval) },
            { path: ROUTES.BAGGAGE_TRACKING, element: withSuspense(BaggageTracking) },
            { path: ROUTES.BOOKING_DETAIL, element: withSuspense(BookingDetail) },
            { path: ROUTES.MODIFY_BOOKING, element: withSuspense(ModifyBookingSearch) },
            { path: ROUTES.REVIEW_CHANGE, element: withSuspense(ReviewFlightChange) },
            { path: ROUTES.CHANGE_SUCCESS, element: withSuspense(FlightChangeSuccess) },
            { path: ROUTES.CANCEL_BOOKING, element: withSuspense(CancelBooking) },

            // --- Check-in Flow ---
            { path: '/check-in', element: <Navigate to={ROUTES.CHECKIN} replace /> },
            { path: ROUTES.CHECKIN, element: withSuspense(CheckinRetrieval) },
            { path: ROUTES.CHECKIN_PASSENGERS, element: withSuspense(CheckinPassengers) },
            { path: ROUTES.CHECKIN_DECLARATION, element: withSuspense(CheckinDeclaration) },
            { path: ROUTES.CHECKIN_SEATS, element: withSuspense(CheckinSeats) },
            { path: ROUTES.CHECKIN_SUCCESS, element: withSuspense(CheckinSuccess) },

            // --- Flight Tracker ---
            { path: ROUTES.FLIGHT_TRACKER, element: withSuspense(FlightTrackerSearch) },
            { path: ROUTES.FLIGHT_TRACKER_RESULTS, element: withSuspense(FlightTrackerResults) },

            // --- Loyalty ---
            { path: ROUTES.LOYALTY, element: withAuth(LoyaltyDashboard) },
            { path: ROUTES.LOYALTY_REDEMPTION, element: withAuth(LoyaltyRedemption) },
            { path: ROUTES.TIER_BENEFITS, element: withAuth(TierBenefits) },
            { path: ROUTES.AWARD_BOOKING, element: withAuth(AwardBooking) },
            { path: ROUTES.MILES_CASH, element: withAuth(MilesCashPayment) },
            { path: ROUTES.FAMILY_POOLING, element: withAuth(FamilyPooling) },
            { path: ROUTES.STATUS_MATCH, element: withAuth(StatusMatch) },

            // --- Codeshare ---
            { path: ROUTES.CODESHARE_FLIGHTS, element: withSuspense(CodeshareFlights) },

            // --- Group Booking (public) ---
            { path: ROUTES.GROUP_BOOKING, element: withSuspense(GroupBooking) },

            // --- Support (public) ---
            { path: ROUTES.HELP_CENTER, element: withSuspense(HelpCenter) },
            { path: ROUTES.SUPPORT_TICKETS, element: withAuth(SupportTickets) },
            { path: ROUTES.CALLBACK_REQUEST, element: withSuspense(CallbackRequest) },

            // --- Special Assistance & Health (public) ---
            { path: ROUTES.SPECIAL_ASSISTANCE, element: withSuspense(SpecialAssistance) },
            { path: ROUTES.HEALTH_REQUIREMENTS, element: withSuspense(HealthRequirements) },
            { path: ROUTES.ACCESSIBILITY_STATEMENT, element: withSuspense(AccessibilityStatement) },
        ],
    },

    // ═══ AUTH ROUTES (standalone, own branding) ════════════════
    { path: ROUTES.LOGIN, element: withSuspense(Login) },
    { path: ROUTES.STAFF_LOGIN, element: withSuspense(StaffLogin) },
    { path: ROUTES.REGISTER, element: withSuspense(Register) },
    { path: ROUTES.FORGOT_PASSWORD, element: withSuspense(ForgotPassword) },
    { path: ROUTES.CREATE_NEW_PASSWORD, element: withSuspense(CreateNewPassword) },
    { path: ROUTES.RESET_SUCCESSFUL, element: withSuspense(ResetSuccessful) },

    // ═══ PROTECTED PASSENGER ROUTES (wrapped in PassengerLayout) ═══
    {
        element: withAuth(PassengerLayout),
        errorElement: <RouteErrorPage />,
        children: [
            { path: ROUTES.MY_DASHBOARD, element: withSuspense(MyDashboard) },
            { path: ROUTES.MY_PROFILE, element: withSuspense(MyProfile) },
            { path: ROUTES.MY_TRIPS, element: withSuspense(MyTrips) },
        ],
    },

    // ═══ PROTECTED ADMIN ROUTES (wrapped in AdminLayout) ══════
    {
        element: withAuth(AdminLayout, OPS_ROLES),
        errorElement: <RouteErrorPage />,
        children: [
            // --- Dashboard ---
            { path: ROUTES.DASHBOARD, element: withSuspense(Dashboard) },
            { path: ROUTES.SALES_DASHBOARD, element: withSuspense(SalesDashboard) },
            { path: ROUTES.PRICING_RULES, element: withSuspense(PricingRulesAdmin) },

            // --- Flight Operations ---
            { path: ROUTES.FLEET_MANAGEMENT, element: withSuspense(FleetManagement) },
            { path: ROUTES.FLIGHT_SCHEDULING, element: withSuspense(FlightScheduling) },
            { path: ROUTES.GATE_ASSIGNMENT, element: withSuspense(GateAssignment) },
            { path: ROUTES.MANAGE_DELAY, element: withSuspense(ManageDelay) },
            { path: ROUTES.DISRUPTION_RESOLUTION, element: withSuspense(DisruptionResolution) },
            { path: ROUTES.AIRCRAFT_SWAP, element: withSuspense(AircraftSwap) },
            { path: ROUTES.REGULATORY_MANIFEST, element: withSuspense(RegulatoryManifest) },
            { path: ROUTES.OPERATIONAL_TRIGGERS, element: withSuspense(OperationalTriggers) },
            { path: ROUTES.ALERT_AUDIT_LOG, element: withSuspense(AlertAuditLog) },
            { path: ROUTES.SEAT_MAP_CMS, element: withSuspense(SeatMapCMS) },
            { path: ROUTES.ROUTE_MANAGEMENT, element: withSuspense(RouteManagement) },
            { path: ROUTES.AIRPORT_MANAGEMENT, element: withSuspense(AirportManagement) },

            // --- User & Account Management ---
            { path: ROUTES.USER_MANAGEMENT, element: withSuspense(UserManagement) },
            { path: ROUTES.ACCOUNT_SETTINGS, element: withSuspense(AccountSettings) },
            { path: ROUTES.NOTIFICATION_PREFERENCES, element: withSuspense(NotificationPreferences) },

            // --- Bookings Management ---
            { path: ROUTES.BOOKINGS, element: withSuspense(Bookings) },
            { path: ROUTES.BOOKING_DETAIL_ADMIN, element: withSuspense(BookingDetailAdmin) },
            { path: ROUTES.TICKET_REISSUE, element: withSuspense(TicketReissue) },

            // --- CMS ---
            { path: ROUTES.LANDING_PAGE_EDITOR, element: withSuspense(LandingPageEditor) },
            { path: ROUTES.PAGE_EDITOR, element: withSuspense(PageEditor) },
            { path: ROUTES.HEADER_MANAGEMENT, element: withSuspense(HeaderManagement) },
            { path: ROUTES.FOOTER_MANAGEMENT, element: withSuspense(FooterManagement) },
            { path: ROUTES.MENU_MANAGEMENT, element: withSuspense(MenuManagement) },
            { path: ROUTES.FAVICON_SEO, element: withSuspense(FaviconSEOAuditLog) },
            { path: ROUTES.ABOUT_VALUES_CMS, element: withSuspense(AboutValuesManagement) },
            { path: ROUTES.DESTINATIONS_CMS, element: withSuspense(DestinationsCMS) },

            // --- Security ---
            { path: ROUTES.SESSION_MONITOR, element: withSuspense(SessionMonitor) },
            { path: ROUTES.SESSION_AUDIT_LOG, element: withSuspense(SessionAuditLog) },
            { path: ROUTES.MFA_SETTINGS, element: withSuspense(MFASettings) },
            { path: ROUTES.SSO_SETTINGS, element: withSuspense(SSOSettings) },
            { path: ROUTES.PASSWORD_POLICY, element: withSuspense(PasswordPolicy) },
            { path: ROUTES.SECURITY_KEYS, element: withSuspense(SecurityKeySetup) },

            // --- Communications ---
            { path: ROUTES.EMAIL_TEMPLATES, element: withSuspense(EmailTemplatesCMS) },
            { path: ROUTES.EMAIL_AUDIT_LOG, element: withSuspense(EmailAuditLog) },
            { path: ROUTES.SMS_CONFIGURATION, element: withSuspense(SMSConfiguration) },
            { path: ROUTES.SMS_AUDIT_LOG, element: withSuspense(SMSAuditLog) },

            // --- Experiments ---
            { path: ROUTES.EXPERIMENTS_DASHBOARD, element: withSuspense(ExperimentsDashboard) },
            { path: ROUTES.EXPERIMENTS_AUDIT_LOG, element: withSuspense(ExperimentsAuditLog) },

            // --- Phase 4: Loyalty Admin, Ancillary, Crew ---
            { path: ROUTES.LOYALTY_ADMIN, element: withSuspense(LoyaltyAdmin) },
            { path: ROUTES.ANCILLARY_ADMIN, element: withSuspense(AncillaryAdmin) },
            { path: ROUTES.BAGGAGE_ADMIN, element: withSuspense(BaggageAdmin) },
            { path: ROUTES.CREW_MANAGEMENT, element: withSuspense(CrewManagement) },
            { path: ROUTES.CREW_SCHEDULING, element: withSuspense(CrewScheduling) },

            // --- IROP & Revenue ---
            { path: ROUTES.MASS_REBOOKING, element: withSuspense(MassRebooking) },
            { path: ROUTES.OVERBOOKING, element: withSuspense(OverbookingManager) },
            { path: ROUTES.CORPORATE_FARES, element: withSuspense(CorporateFares) },

            // --- Support Admin ---
            { path: ROUTES.COMPLAINT_MANAGEMENT, element: withSuspense(ComplaintManagement) },

            // --- Phase 4: Interline & Reporting ---
            { path: ROUTES.INTERLINE_ADMIN, element: withSuspense(InterlineAdmin) },
            { path: ROUTES.REVENUE_REPORTS, element: withSuspense(RevenueReports) },
            { path: ROUTES.LOAD_FACTOR_REPORTS, element: withSuspense(LoadFactorReports) },
            { path: ROUTES.OTP_REPORTS, element: withSuspense(OTPReports) },
            { path: ROUTES.PASSENGER_STATS, element: withSuspense(PassengerStats) },
            { path: ROUTES.FINANCIAL_RECONCILIATION, element: withSuspense(FinancialReconciliation) },
        ],
    },

    // ═══ YUBIKEY VERIFY GATE (Standalone — no admin layout) ════
    {
        path: ROUTES.YUBIKEY_VERIFY,
        element: (
            <ProtectedRoute allowedRoles={['super_admin', 'ops_manager', 'cs_agent']}>
                {withSuspense(YubiKeyVerify)}
            </ProtectedRoute>
        ),
    },

    // ═══ 404 CATCH-ALL ═════════════════════════════════════════
    { path: '*', element: <NotFound /> },
]);
