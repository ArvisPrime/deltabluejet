/**
 * Firestore Data Models — Deltablue Jet Air PSS
 *
 * These interfaces define the shape of all Firestore documents.
 * Used by both Cloud Functions and the frontend service layer.
 */

import { Timestamp } from 'firebase/firestore';

// ─── Flights ───────────────────────────────────────────────

export interface FlightDoc {
    id: string;
    flightNumber: string;           // e.g. "DB-101"
    airline: string;                 // "Deltablue Jet Air"
    origin: AirportRef;
    destination: AirportRef;
    departureTime: Timestamp;
    arrivalTime: Timestamp;
    status: FlightStatus;
    aircraft: AircraftRef;
    gate: string | null;
    terminal: string | null;
    seatsAvailable: Record<string, number>;  // { economy: 140, business: 24, first: 8 }
    seatsTaken: Record<string, number>;
    baseFare: Record<string, number>;        // { economy: 350, business: 1200, first: 3500 }
    routeId: string;
    daysOfWeek: number[];           // [1,3,5] = Mon/Wed/Fri
    delayMinutes: number;
    delayReason: string | null;
    newDepartureTime: Timestamp | null;
    cancellationReason: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type FlightStatus =
    | 'scheduled'
    | 'boarding'
    | 'departed'
    | 'in_air'
    | 'landed'
    | 'arrived'
    | 'delayed'
    | 'cancelled';

export interface AirportRef {
    code: string;     // IATA 3-letter
    name: string;
    city: string;
    country: string;
    timezone: string;
}

export interface AircraftRef {
    id: string;
    type: string;      // e.g. "Boeing 737-800"
    registration: string;
}

// ─── Aircraft ──────────────────────────────────────────────

export interface MaintenanceWindow {
    startDate: Timestamp;
    endDate: Timestamp;
    reason: string;
    createdBy: string;               // userId of ops manager who scheduled
}

export interface WeightLimits {
    maxTakeoff: number;              // kg
    maxLanding: number;              // kg
    maxPayload: number;              // kg
}

export interface AircraftDoc {
    id: string;
    type: string;
    registration: string;
    manufacturer: string;
    model: string;
    totalSeats: number;
    seatConfig: Record<string, number>;  // { economy: 162, business: 24, first: 8 }
    range_km: number;
    status: 'active' | 'maintenance' | 'retired';
    homeBase: string;                    // IATA code
    lastMaintenanceDate: Timestamp;
    nextMaintenanceDate: Timestamp;
    maintenanceWindows: MaintenanceWindow[];
    weightLimits: WeightLimits;
    notes: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Routes ────────────────────────────────────────────────

export interface RouteDoc {
    id: string;
    origin: AirportRef;
    destination: AirportRef;
    distance_km: number;
    duration_minutes: number;
    isActive: boolean;
    baseFares: Record<string, number>;   // { economy: 350, business: 1200, first: 3500 }
    frequency: number[];                 // Days of week [1,2,3,4,5,6,7] (1=Mon)
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Schedules ─────────────────────────────────────────────

export type ScheduleStatus = 'draft' | 'published' | 'suspended' | 'expired';

export interface ScheduleDoc {
    id: string;
    routeId: string;
    aircraftId: string;
    flightNumberPrefix: string;          // e.g. "DB-1" → generates DB-101, DB-102…
    daysOfWeek: number[];                // [1,3,5] = Mon/Wed/Fri
    departureTime: string;               // "08:30" (local time)
    arrivalTime: string;                 // "11:45" (local time)
    effectiveFrom: Timestamp;            // Date range start
    effectiveTo: Timestamp;              // Date range end
    status: ScheduleStatus;
    publishedFlightCount: number;        // Flights generated from this schedule
    createdBy: string;                   // userId
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Bookings ──────────────────────────────────────────────

export interface BookingDoc {
    id: string;
    pnr: string;                    // 6-char alphanumeric
    userId: string;                  // owner
    flightId: string;
    flightNumber: string;
    status: BookingStatus;
    origin: AirportRef;
    destination: AirportRef;
    departureTime: Timestamp;
    arrivalTime: Timestamp;
    fareClass: string;
    totalAmount: number;
    currency: string;
    passengerCount: number;
    contactEmail: string;
    contactPhone: string;
    paymentIntentId: string | null;  // Stripe
    tripType?: 'one-way' | 'round-trip' | 'multi-city';
    segments?: BookingSegment[];     // Multi-city legs
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface BookingSegment {
    legIndex: number;                // 0-based
    flightId: string;
    flightNumber: string;
    origin: AirportRef;
    destination: AirportRef;
    departureTime: Timestamp;
    arrivalTime: Timestamp;
    fareClass: string;
    fareAmount: number;
    seatNumber: string | null;
}

export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'boarded'
    | 'completed'
    | 'cancelled'
    | 'refunded';

// ─── Passengers (sub-collection of bookings) ──────────────

export interface PassengerDoc {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    documentType: 'passport' | 'national_id';
    documentNumber: string;
    seatNumber: string | null;
    boardingPassUrl: string | null;
    checkedIn: boolean;
    specialRequests: string[];
}

// ─── Payments ──────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';

export interface PaymentDoc {
    id: string;
    bookingId: string;
    amount: number;                       // Total in smallest currency unit (cents)
    currency: string;                     // "USD"
    status: PaymentStatus;
    stripePaymentIntentId: string | null; // null in dev-mode
    last4: string | null;                 // Last 4 digits of card
    cardBrand: string | null;             // "visa", "mastercard"
    refundedAmount: number;               // Total refunded (cents)
    eTicketNumber: string | null;         // DBJ-20260221-0001
    metadata: {
        passengerName: string;
        flightNumber: string;
        route: string;
        seatClass: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Destinations ──────────────────────────────────────────

export interface DestinationDoc {
    id: string;
    city: string;
    country: string;
    airportCode: string;
    airportName: string;
    description: string;
    imageUrl: string;
    highlights: string[];
    climate: string;
    bestTimeToVisit: string;
    isPromoted: boolean;
    createdAt: Timestamp;
}

// ─── Seat Maps ─────────────────────────────────────────────

export interface SeatMapDoc {
    id: string;
    aircraftType: string;
    rows: number;
    columns: string[];          // ['A','B','C','D','E','F']
    exitRows: number[];
    premiumRows: number[];
    blockedSeats: string[];     // e.g. ['12A','12F']
    classMap: Record<string, { startRow: number; endRow: number }>;
}

// ─── Check-ins ─────────────────────────────────────────────

export interface CheckinDoc {
    id: string;
    bookingId: string;
    pnr: string;
    passengerId: string;
    seatNumber: string;
    boardingGroup: string;
    boardingPassUrl: string | null;
    checkedInAt: Timestamp;
}

// ─── Audit Logs ────────────────────────────────────────────

export interface AuditLogDoc {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userEmail: string;
    details: Record<string, any>;
    timestamp: Timestamp;
}

// ─── Users ─────────────────────────────────────────────────

export interface UserDoc {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    role: 'super_admin' | 'ops_manager' | 'crew_sched' | 'cs_agent' | 'customer';
    provider: 'email' | 'google';
    mfaEnabled: boolean;
    lastLoginAt: Timestamp;
    createdAt: Timestamp;
}

// ─── Customer Profile ──────────────────────────────────────

export type DocumentType = 'passport' | 'national_id' | 'drivers_license';

export interface CustomerDoc {
    uid: string;                         // matches auth UID
    email: string;
    displayName: string;
    phone: string | null;
    nationality: string | null;
    documentType: DocumentType | null;
    documentNumber: string | null;
    documentExpiry: Timestamp | null;
    dateOfBirth: Timestamp | null;
    preferences: {
        seatPreference: 'window' | 'aisle' | 'middle' | 'none';
        mealPreference: 'standard' | 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'none';
        emailNotifications: boolean;
        smsNotifications: boolean;
    };
    loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalTrips: number;
    gdprConsent: boolean;
    marketingOptIn: boolean;
    consentUpdatedAt: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Saved Travelers ───────────────────────────────────────

export interface SavedTravelerDoc {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Timestamp | null;
    nationality: string | null;
    documentType: DocumentType | null;
    documentNumber: string | null;
    documentExpiry: Timestamp | null;
    email: string | null;
    phone: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Email Templates ───────────────────────────────────────

export type TemplateStatus = 'live' | 'draft' | 'archived';

export interface EmailTemplateDoc {
    id: string;
    name: string;                        // e.g. "Booking Confirmation"
    category: 'transactional' | 'marketing' | 'operational' | 'system';
    subject: string;                     // supports {{variables}}
    htmlBody: string;                    // template HTML with {{variables}}
    variables: string[];                 // e.g. ['passengerName', 'pnr', 'flightNumber']
    status: TemplateStatus;
    version: number;
    updatedBy: string;                   // user email
    updatedAt: Timestamp;
    createdAt: Timestamp;
}

// ─── SMS Templates ─────────────────────────────────────────

export interface SmsTemplateDoc {
    id: string;
    name: string;
    category: 'transactional' | 'marketing' | 'operational' | 'system';
    body: string;                        // supports {{variables}}
    variables: string[];
    status: TemplateStatus;
    provider: 'twilio' | 'vonage' | 'mock';
    maxLength: number;                   // character limit
    updatedBy: string;
    updatedAt: Timestamp;
    createdAt: Timestamp;
}

// ─── Notification Logs ─────────────────────────────────────

export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'sent' | 'failed' | 'queued' | 'delivered' | 'bounced';

export interface NotificationLogDoc {
    id: string;
    channel: NotificationChannel;
    templateId: string;
    templateName: string;
    recipientEmail: string | null;
    recipientPhone: string | null;
    bookingRef: string | null;           // PNR or booking ID
    subject: string | null;              // email only
    status: NotificationStatus;
    provider: string;                    // 'sendgrid', 'twilio', 'mock'
    errorMessage: string | null;
    sentBy: string;                      // user email or 'system'
    sentAt: Timestamp;
}

// ─── CMS Pages ─────────────────────────────────────────────

export type CmsPageStatus = 'draft' | 'published' | 'archived';

export interface CmsPageDoc {
    id: string;
    title: string;
    slug: string;                        // URL-safe identifier
    content: string;                     // HTML content
    metaTitle: string;
    metaDescription: string;
    featuredImage: string | null;
    parentPage: string | null;           // parent page ID
    tags: string[];
    status: CmsPageStatus;
    author: string;                      // user email
    updatedAt: Timestamp;
    createdAt: Timestamp;
}

// ─── CMS Config ────────────────────────────────────────────

export interface CmsMenuItemDoc {
    label: string;
    href: string;
    order: number;
    children: CmsMenuItemDoc[];
    openInNewTab?: boolean;
    hasMegaMenu?: boolean;
    badge?: string;             // e.g. "NEW", "HOT"
}

export interface CmsHeaderConfigDoc {
    logoUrl: string | null;
    faviconUrl?: string | null;
    brandName?: string;
    tagSuffix?: string;
    announcementBar: string | null;
    announcementActive: boolean;
    navItems: CmsMenuItemDoc[];
    ctaLabel?: string;
    ctaLink?: string;
    ctaVisible?: boolean;
    showSearch?: boolean;
    showLanguageSwitcher?: boolean;
    showLoginButton?: boolean;
    updatedAt: Timestamp;
}

export interface CmsDestinationDoc {
    city: string;
    country: string;
    airport: string;
    frequency: string;
    equipment: string;
    profile: string;
    img: string;
    region: string;
    heroDescription: string;
    loungeInfo: string;
    securityInfo: string;
    weatherTemp: string;
    weatherVisibility: string;
    visible: boolean;
}

export interface CmsDestinationsConfigDoc {
    destinations: Record<string, CmsDestinationDoc>;
    // Page-level content (hero, route network, intercontinental reach)
    heroImage?: string;
    heroTitle?: string;
    heroHighlight?: string;
    heroSubtitle?: string;
    routeNetworkTitle?: string;
    routeNetworkSubtitle?: string;
    reachTitle?: string;
    reachHighlight?: string;
    reachSubtitle?: string;
    stat1Value?: string;
    stat1Label?: string;
    stat2Value?: string;
    stat2Label?: string;
    updatedAt: Timestamp;
}

export interface CmsFooterConfigDoc {
    columns: { title: string; links: { label: string; href: string }[] }[];
    socialLinks: { platform: string; url: string }[];
    contactEmail: string;
    contactPhone: string;
    copyrightText: string;
    showPaymentIcons?: boolean;
    newsletterEnabled?: boolean;
    newsletterTitle?: string;
    newsletterSubtitle?: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
    legalLinks?: { label: string; href: string }[];
    updatedAt: Timestamp;
}

export interface CmsAboutValueItem {
    icon: string;
    title: string;
    body: string;
}

export interface CmsAboutStatItem {
    value: string;
    label: string;
    icon: string;
}

export interface CmsAboutMilestoneItem {
    year: string;
    event: string;
}

export interface CmsAboutLeaderItem {
    name: string;
    role: string;
    icon: string;
}

export interface CmsAboutValuesDoc {
    sectionLabel: string;
    sectionTitle: string;
    values: CmsAboutValueItem[];
    updatedAt: Timestamp;
}

export interface CmsAboutPageDoc extends CmsAboutValuesDoc {
    // Hero section
    heroBadge: string;
    heroHeading: string;
    heroSubtitle: string;
    // Stats section
    stats: CmsAboutStatItem[];
    // Mission section
    missionBadge: string;
    missionHeading: string;
    missionParagraph1: string;
    missionParagraph2: string;
    // Milestones section
    milestones: CmsAboutMilestoneItem[];
    // Leadership section
    leadersBadge: string;
    leadersTitle: string;
    leaders: CmsAboutLeaderItem[];
    // CTA section
    ctaHeading: string;
    ctaDescription: string;
    ctaButtonText: string;
    ctaButtonLink: string;
}

// ─── CMS Landing Page ─────────────────────────────────────

export interface CmsLandingHeroSection {
    badge: string;
    headingLine1: string;
    headingLine2: string;
    backgroundImageUrl: string;
    backgroundType?: 'image' | 'video';
}

export interface CmsLandingTickerItem {
    icon: string;
    iconColor: string;
    text: string;
    showPulse?: boolean;
}

export interface CmsLandingPromoCard {
    title: string;
    tag: string;
    price: string;
    imageUrl: string;
}

export interface CmsLandingPromoSection {
    sectionLabel: string;
    sectionTitle: string;
    sectionTitleHighlight: string;
    ctaLabel: string;
    featuredPromo: {
        title: string;
        tag: string;
        description: string;
        imageUrl: string;
        ctaLabel: string;
    };
    gridPromos: CmsLandingPromoCard[];
}

export interface CmsLandingDestinationCard {
    city: string;
    country: string;
    airport: string;
    imageUrl: string;
    description: string;
}

export interface CmsLandingDestinationSection {
    sectionLabel: string;
    sectionTitle: string;
    sectionTitleHighlight: string;
    destinations: CmsLandingDestinationCard[];
}

export interface CmsLandingClubStat {
    label: string;
    value: string;
}

export interface CmsLandingClubSection {
    badge: string;
    heading: string;
    headingHighlight: string;
    description: string;
    stats: CmsLandingClubStat[];
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    cardTierName: string;
    cardMemberName: string;
    cardReference: string;
    cardValidThru: string;
}

export interface CmsLandingStatusWidget {
    title: string;
    subtitle: string;
    visible: boolean;
}

export interface CmsLandingPageDoc {
    hero: CmsLandingHeroSection;
    ticker: CmsLandingTickerItem[];
    promotions: CmsLandingPromoSection;
    destinations: CmsLandingDestinationSection;
    club: CmsLandingClubSection;
    statusWidget: CmsLandingStatusWidget;
    updatedAt: Timestamp;
}

// ─── Loyalty Program ──────────────────────────────────────

export type LoyaltyTier = 'blue' | 'silver' | 'gold' | 'platinum';

export interface PointsHistoryEntry {
    date: Timestamp;
    amount: number;
    type: 'earn' | 'deduct';
    bookingRef: string | null;
    description: string;
}

export interface LoyaltyDoc {
    id: string;
    uid: string;
    tier: LoyaltyTier;
    totalPoints: number;
    lifetimePoints: number;
    pointsHistory: PointsHistoryEntry[];
    tierExpiryDate: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// ─── Audit Log ────────────────────────────────────────────

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogDoc {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    module: string;           // Bookings, Payments, Flights, Auth, Admin
    entityType: string;       // booking, flight, aircraft, user
    entityId: string;
    description: string;
    severity: AuditSeverity;
    timestamp: Timestamp;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
}

// ─── Notification Preferences ─────────────────────────────

export interface NotificationChannels {
    email: boolean;
    sms: boolean;
    push: boolean;
}

export interface NotificationPrefsDoc {
    pauseAll: boolean;
    flightDisruptions: { enabled: boolean; channels: NotificationChannels };
    gateChanges: { enabled: boolean; channels: NotificationChannels };
    checkinReminders: { enabled: boolean; channels: NotificationChannels };
    specialOffers: { enabled: boolean; channels: NotificationChannels };
    updatedAt: Timestamp;
}
