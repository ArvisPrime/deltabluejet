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

// --- Auth ---
const Login = lazyRetry(() => import('../features/auth/Login'));
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
const TicketConfirmation = lazyRetry(() => import('../features/booking/TicketConfirmation'));
const ManageBookingRetrieval = lazyRetry(() => import('../features/booking/ManageBookingRetrieval'));
const BookingDetail = lazyRetry(() => import('../features/booking/BookingDetail'));
const ModifyBookingSearch = lazyRetry(() => import('../features/booking/ModifyBookingSearch'));
const ReviewFlightChange = lazyRetry(() => import('../features/booking/ReviewFlightChange'));
const FlightChangeSuccess = lazyRetry(() => import('../features/booking/FlightChangeSuccess'));
const Bookings = lazyRetry(() => import('../features/booking/Bookings'));
const TicketReissue = lazyRetry(() => import('../features/booking/TicketReissue'));
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

// --- Communications ---
const EmailTemplatesCMS = lazyRetry(() => import('../features/communications/EmailTemplatesCMS'));
const EmailAuditLog = lazyRetry(() => import('../features/communications/EmailAuditLog'));
const SMSConfiguration = lazyRetry(() => import('../features/communications/SMSConfiguration'));
const SMSAuditLog = lazyRetry(() => import('../features/communications/SMSAuditLog'));

// --- Experiments ---
const ExperimentsDashboard = lazyRetry(() => import('../features/experiments/ExperimentsDashboard'));
const ExperimentsAuditLog = lazyRetry(() => import('../features/experiments/ExperimentsAuditLog'));


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
const OPS_ROLES: AuthRole[] = ['super_admin', 'ops_manager', 'crew_sched'];
const ADMIN_ROLES: AuthRole[] = ['super_admin'];
const AGENT_ROLES: AuthRole[] = ['super_admin', 'ops_manager', 'cs_agent'];

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

            // --- Booking Flow ---
            { path: ROUTES.FLIGHT_SEARCH, element: withSuspense(FlightSearch) },
            { path: ROUTES.FLIGHT_RESULTS, element: withSuspense(FlightResults) },
            { path: ROUTES.FARE_SELECTION, element: withSuspense(FareClassSelection) },
            { path: ROUTES.PASSENGER_DETAILS, element: withSuspense(PassengerDetails) },
            { path: ROUTES.SEAT_SELECTION, element: withSuspense(SeatSelection) },
            { path: ROUTES.PAYMENT, element: withSuspense(PaymentProcessing) },
            { path: ROUTES.TICKET_CONFIRMATION, element: withSuspense(TicketConfirmation) },
            { path: ROUTES.MULTI_CITY, element: withSuspense(MultiCitySearch) },

            // --- Manage Booking ---
            { path: ROUTES.MANAGE_BOOKING, element: withSuspense(ManageBookingRetrieval) },
            { path: ROUTES.BOOKING_DETAIL, element: withSuspense(BookingDetail) },
            { path: ROUTES.MODIFY_BOOKING, element: withSuspense(ModifyBookingSearch) },
            { path: ROUTES.REVIEW_CHANGE, element: withSuspense(ReviewFlightChange) },
            { path: ROUTES.CHANGE_SUCCESS, element: withSuspense(FlightChangeSuccess) },

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
        ],
    },

    // ═══ AUTH ROUTES (standalone, own branding) ════════════════
    { path: ROUTES.LOGIN, element: withSuspense(Login) },
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

            // --- User & Account Management ---
            { path: ROUTES.USER_MANAGEMENT, element: withSuspense(UserManagement) },
            { path: ROUTES.ACCOUNT_SETTINGS, element: withSuspense(AccountSettings) },
            { path: ROUTES.NOTIFICATION_PREFERENCES, element: withSuspense(NotificationPreferences) },

            // --- Bookings Management ---
            { path: ROUTES.BOOKINGS, element: withSuspense(Bookings) },
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

            // --- Communications ---
            { path: ROUTES.EMAIL_TEMPLATES, element: withSuspense(EmailTemplatesCMS) },
            { path: ROUTES.EMAIL_AUDIT_LOG, element: withSuspense(EmailAuditLog) },
            { path: ROUTES.SMS_CONFIGURATION, element: withSuspense(SMSConfiguration) },
            { path: ROUTES.SMS_AUDIT_LOG, element: withSuspense(SMSAuditLog) },

            // --- Experiments ---
            { path: ROUTES.EXPERIMENTS_DASHBOARD, element: withSuspense(ExperimentsDashboard) },
            { path: ROUTES.EXPERIMENTS_AUDIT_LOG, element: withSuspense(ExperimentsAuditLog) },
        ],
    },

    // ═══ 404 CATCH-ALL ═════════════════════════════════════════
    { path: '*', element: <NotFound /> },
]);
