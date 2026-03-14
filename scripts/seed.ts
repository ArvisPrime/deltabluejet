/**
 * Firestore Seed Script — Phase 0
 *
 * Seeds the Firebase Emulator with baseline data for development.
 * Run with: npm run seed (while emulators are running)
 *
 * Targets the local Firestore emulator at localhost:8080
 * and Auth emulator at localhost:9099.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Configuration ─────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Auto-detect emulator: only use emulators if FIRESTORE_EMULATOR_HOST is explicitly set
const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (isEmulator) {
    // If Firestore emulator is set, also default the Auth emulator
    if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    }
}

// Try to load service account key for project ID, or use project default
const serviceAccountPath = resolve(__dirname, '..', 'deltablue-jet-air-firebase-adminsdk-fbsvc-ec787d4502.json');

if (existsSync(serviceAccountPath)) {
    const sa = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
    initializeApp({ credential: cert(sa) });
} else {
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const db = getFirestore();
const auth = getAuth();

// ─── Type Definitions ──────────────────────────────────────

interface AirportRef {
    code: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
}

interface AircraftSeed {
    id: string;
    type: string;
    registration: string;
    manufacturer: string;
    model: string;
    totalSeats: number;
    seatConfig: Record<string, number>;
    range_km: number;
    status: 'active' | 'maintenance' | 'retired';
    homeBase: string;
    weightLimits: { maxTakeoff: number; maxLanding: number; maxPayload: number };
    notes: string;
}

interface RouteSeed {
    origin: string;
    destination: string;
    distance_km: number;
    duration_minutes: number;
    baseFares: { economy: number; business: number; first: number };
    frequency: number[];
}

// ─── Airports ──────────────────────────────────────────────

const AIRPORTS: Record<string, AirportRef> = {
    BJL: { code: 'BJL', name: 'Banjul Intl Airport', city: 'Banjul', country: 'The Gambia', timezone: 'Africa/Banjul' },
    DSS: { code: 'DSS', name: 'Blaise Diagne Intl Airport', city: 'Dakar', country: 'Senegal', timezone: 'Africa/Dakar' },
    ACC: { code: 'ACC', name: 'Kotoka Intl Airport', city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
    FNA: { code: 'FNA', name: 'Lungi Intl Airport', city: 'Freetown', country: 'Sierra Leone', timezone: 'Africa/Freetown' },
    CKY: { code: 'CKY', name: 'Conakry Intl Airport', city: 'Conakry', country: 'Guinea', timezone: 'Africa/Conakry' },
    DAC: { code: 'DAC', name: 'Hazrat Shahjalal Intl Airport', city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
    ROB: { code: 'ROB', name: 'Roberts Intl Airport', city: 'Monrovia', country: 'Liberia', timezone: 'Africa/Monrovia' },
    OXB: { code: 'OXB', name: 'Osvaldo Vieira Intl Airport', city: 'Bissau', country: 'Guinea-Bissau', timezone: 'Africa/Bissau' },
};

// ─── Aircraft Fleet — Embraer ERJ-120 Brasilia ─────────────
// All aircraft are Embraer EMB-120 Brasilia twin-turboprop commuter airliners.
// Real-world specs: 30 seats, PW118/118A engines, cruise 555 km/h, ceiling 9,754 m.

const AIRCRAFT: AircraftSeed[] = [
    {
        id: 'ac-001', type: 'Embraer ERJ-120', registration: 'C5-DBA',
        manufacturer: 'Embraer', model: 'EMB-120ER Brasilia',
        totalSeats: 30, seatConfig: { economy: 26, business: 4, first: 0 },
        range_km: 2908, status: 'active', homeBase: 'BJL',
        weightLimits: { maxTakeoff: 11990, maxLanding: 11250, maxPayload: 3272 },
        notes: 'Primary workhorse. Extended-range variant for West African network. PW118A engines.',
    },
    {
        id: 'ac-002', type: 'Embraer ERJ-120', registration: 'C5-DBB',
        manufacturer: 'Embraer', model: 'EMB-120ER Brasilia',
        totalSeats: 30, seatConfig: { economy: 26, business: 4, first: 0 },
        range_km: 2908, status: 'active', homeBase: 'BJL',
        weightLimits: { maxTakeoff: 11990, maxLanding: 11250, maxPayload: 3272 },
        notes: 'Second mainline aircraft. Shared roster with C5-DBA on high-frequency routes.',
    },
    {
        id: 'ac-003', type: 'Embraer ERJ-120', registration: 'C5-DBC',
        manufacturer: 'Embraer', model: 'EMB-120ER Brasilia',
        totalSeats: 30, seatConfig: { economy: 30, business: 0, first: 0 },
        range_km: 2908, status: 'active', homeBase: 'BJL',
        weightLimits: { maxTakeoff: 11990, maxLanding: 11250, maxPayload: 3272 },
        notes: 'All-economy high-density configuration for short-haul shuttle routes.',
    },
    {
        id: 'ac-004', type: 'Embraer ERJ-120', registration: 'C5-DBD',
        manufacturer: 'Embraer', model: 'EMB-120ER Brasilia',
        totalSeats: 30, seatConfig: { economy: 26, business: 4, first: 0 },
        range_km: 2908, status: 'maintenance', homeBase: 'BJL',
        weightLimits: { maxTakeoff: 11990, maxLanding: 11250, maxPayload: 3272 },
        notes: 'Scheduled for C-check maintenance. Expected return in 2 weeks.',
    },
    {
        id: 'ac-005', type: 'Embraer ERJ-120', registration: 'C5-DBE',
        manufacturer: 'Embraer', model: 'EMB-120ER Brasilia',
        totalSeats: 30, seatConfig: { economy: 26, business: 4, first: 0 },
        range_km: 2908, status: 'active', homeBase: 'BJL',
        weightLimits: { maxTakeoff: 11990, maxLanding: 11250, maxPayload: 3272 },
        notes: 'Reserve aircraft. Available for charter and ad-hoc schedule support.',
    },
];

// ─── Routes (8 routes per plan spec) ───────────────────────

const ROUTES: RouteSeed[] = [
    { origin: 'BJL', destination: 'DSS', distance_km: 310, duration_minutes: 45, baseFares: { economy: 180, business: 450, first: 0 }, frequency: [1, 2, 3, 4, 5, 6, 7] },
    { origin: 'BJL', destination: 'ACC', distance_km: 1420, duration_minutes: 180, baseFares: { economy: 350, business: 1200, first: 3500 }, frequency: [1, 3, 5, 7] },
    { origin: 'BJL', destination: 'FNA', distance_km: 680, duration_minutes: 90, baseFares: { economy: 220, business: 650, first: 0 }, frequency: [2, 4, 6] },
    { origin: 'BJL', destination: 'CKY', distance_km: 960, duration_minutes: 120, baseFares: { economy: 280, business: 850, first: 0 }, frequency: [1, 3, 5] },
    { origin: 'BJL', destination: 'ROB', distance_km: 1200, duration_minutes: 150, baseFares: { economy: 320, business: 950, first: 2800 }, frequency: [2, 5] },
    { origin: 'BJL', destination: 'OXB', distance_km: 310, duration_minutes: 45, baseFares: { economy: 150, business: 400, first: 0 }, frequency: [1, 3, 5, 7] },
    { origin: 'BJL', destination: 'DAC', distance_km: 11000, duration_minutes: 780, baseFares: { economy: 850, business: 2800, first: 6500 }, frequency: [3, 7] },
    { origin: 'DSS', destination: 'ACC', distance_km: 1700, duration_minutes: 210, baseFares: { economy: 380, business: 1300, first: 3800 }, frequency: [1, 4, 6] },
];

// ─── Test User Accounts ────────────────────────────────────

const TEST_USERS = [
    {
        uid: 'test-customer-001',
        email: 'customer@deltabluejet.com',
        password: 'Test1234!',
        displayName: 'Amina Jallow',
        role: 'customer' as const,
    },
    {
        uid: 'test-ops-001',
        email: 'ops@deltabluejet.com',
        password: 'Test1234!',
        displayName: 'Ousman Ceesay',
        role: 'ops_manager' as const,
    },
    {
        uid: 'test-admin-001',
        email: 'admin@deltabluejet.com',
        password: 'Test1234!',
        displayName: 'Marcus Chen',
        role: 'super_admin' as const,
    },
];

// ─── Helpers ───────────────────────────────────────────────

function generatePNR(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function futureDate(daysFromNow: number, hours = 8, minutes = 0): Timestamp {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    return Timestamp.fromDate(d);
}

function pastDate(daysAgo: number): Timestamp {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return Timestamp.fromDate(d);
}

// ─── Main Seed Function ────────────────────────────────────

async function seed(): Promise<void> {
    console.log('🌱 Starting Deltablue Jet Air Phase 0 seed...');
    console.log(`   Target: ${process.env.FIRESTORE_EMULATOR_HOST ? 'EMULATOR' : 'PRODUCTION'}\n`);

    // ── 1. Seed Test Users via Auth ─────────────────────────

    console.log('👤 Seeding test user accounts...');
    for (const user of TEST_USERS) {
        try {
            // Try to create the user; if exists, update
            await auth.createUser({
                uid: user.uid,
                email: user.email,
                password: user.password,
                displayName: user.displayName,
            });
        } catch (err: any) {
            if (err.code === 'auth/uid-already-exists' || err.code === 'auth/email-already-exists') {
                console.log(`   ⏭️  User ${user.email} already exists, skipping creation`);
            } else {
                console.warn(`   ⚠️  Could not create user ${user.email}: ${err.message || err.code}`);
            }
        }

        try {
            // Set custom claims for role
            await auth.setCustomUserClaims(user.uid, { role: user.role });
        } catch (err: any) {
            console.warn(`   ⚠️  Could not set claims for ${user.email}: ${err.message || err.code}`);
        }

        // Create Firestore user document
        await db.doc(`users/${user.uid}`).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: null,
            role: user.role,
            provider: 'email',
            mfaEnabled: false,
            lastLoginAt: Timestamp.now(),
            createdAt: Timestamp.now(),
        });
    }
    console.log(`   → ${TEST_USERS.length} test users created with roles\n`);

    // ── 2. Seed Aircraft ────────────────────────────────────

    console.log('✈️  Seeding aircraft...');
    const aircraftBatch = db.batch();
    for (const ac of AIRCRAFT) {
        aircraftBatch.set(db.doc(`aircraft/${ac.id}`), {
            ...ac,
            lastMaintenanceDate: pastDate(30),
            nextMaintenanceDate: futureDate(60),
            maintenanceWindows: ac.status === 'maintenance' ? [
                { startDate: pastDate(2), endDate: futureDate(12), reason: 'C-Check scheduled maintenance', createdBy: 'test-ops-001' },
            ] : [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }
    await aircraftBatch.commit();
    console.log(`   → ${AIRCRAFT.length} aircraft created\n`);

    // ── 3. Seed Routes ──────────────────────────────────────

    console.log('🗺️  Seeding routes...');
    const routesBatch = db.batch();
    for (const route of ROUTES) {
        const id = `${route.origin}-${route.destination}`.toLowerCase();
        routesBatch.set(db.doc(`routes/${id}`), {
            id,
            origin: AIRPORTS[route.origin],
            destination: AIRPORTS[route.destination],
            distance_km: route.distance_km,
            duration_minutes: route.duration_minutes,
            isActive: true,
            baseFares: route.baseFares,
            frequency: route.frequency,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }
    await routesBatch.commit();
    console.log(`   → ${ROUTES.length} routes created\n`);

    // ── 4. Seed Flights (next 3 days) ───────────────────────

    console.log('🛫 Seeding flights...');
    const flights: Array<Record<string, any>> = [];
    let flightCounter = 100;

    for (let day = 1; day <= 3; day++) {
        for (const route of ROUTES) {
            flightCounter++;
            const flightNumber = `DB-${flightCounter}`;
            const aircraft = AIRCRAFT[flightCounter % AIRCRAFT.length];
            const departureHour = 6 + Math.floor(Math.random() * 14);
            const departureTime = futureDate(day, departureHour, Math.floor(Math.random() * 4) * 15);

            const arrDate = new Date(departureTime.toDate().getTime() + route.duration_minutes * 60 * 1000);
            const arrivalTime = Timestamp.fromDate(arrDate);

            const flight = {
                id: `fl-${flightCounter}`,
                flightNumber,
                airline: 'Deltablue Jet Air',
                origin: AIRPORTS[route.origin],
                destination: AIRPORTS[route.destination],
                departureTime,
                arrivalTime,
                status: 'scheduled' as const,
                aircraft: { id: aircraft.id, type: aircraft.type, registration: aircraft.registration },
                gate: null,
                terminal: null,
                seatsAvailable: { ...aircraft.seatConfig },
                seatsTaken: { economy: 0, business: 0, first: 0 },
                baseFare: {
                    economy: 250 + Math.floor(Math.random() * 200),
                    business: 800 + Math.floor(Math.random() * 500),
                    first: 2500 + Math.floor(Math.random() * 1500),
                },
                routeId: `${route.origin}-${route.destination}`.toLowerCase(),
                daysOfWeek: [1, 3, 5], // Mon/Wed/Fri
                delayMinutes: 0,
                cancellationReason: null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            flights.push(flight);
        }
    }

    // Write in batches of 400 (Firestore batch limit is 500)
    for (let i = 0; i < flights.length; i += 400) {
        const batch = db.batch();
        const chunk = flights.slice(i, i + 400);
        for (const f of chunk) {
            batch.set(db.doc(`flights/${f.id}`), f);
        }
        await batch.commit();
    }
    console.log(`   → ${flights.length} flights created (3 days)\n`);

    // ── 5. Seed Sample Bookings (5 bookings, various statuses) ──

    console.log('🎫 Seeding sample bookings...');
    const bookingStatuses = ['confirmed', 'pending', 'cancelled', 'completed', 'checked_in'] as const;
    const bookings: Array<Record<string, any>> = [];

    for (let i = 0; i < 5; i++) {
        const flight = flights[i];
        const booking = {
            id: `bk-${i + 1}`,
            pnr: generatePNR(),
            userId: 'test-customer-001',
            flightId: flight.id,
            flightNumber: flight.flightNumber,
            status: bookingStatuses[i],
            origin: flight.origin,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            fareClass: i < 3 ? 'economy' : (i === 3 ? 'business' : 'first'),
            totalAmount: i < 3 ? flight.baseFare.economy : (i === 3 ? flight.baseFare.business : flight.baseFare.first),
            currency: 'USD',
            passengerCount: 1,
            contactEmail: 'customer@deltabluejet.com',
            contactPhone: '+220-777-1234',
            paymentIntentId: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        bookings.push(booking);
    }

    const bookingsBatch = db.batch();
    for (const bk of bookings) {
        bookingsBatch.set(db.doc(`bookings/${bk.id}`), bk);
    }
    await bookingsBatch.commit();
    console.log(`   → ${bookings.length} sample bookings created\n`);

    // ── 6. Seed Seat Maps ───────────────────────────────────

    console.log('💺 Seeding seat maps...');
    // ERJ-120 Brasilia: 10 rows × 3 seats (A-B-C), 1+2 config
    // Row 1 = Business (4 seats: 1A,1B on left, 1C aisle-right — plus row 2 single)
    // Rows 1-2 = Business (4 seats), Rows 3-10 = Economy (26 seats)
    // For all-economy variant (ac-003): Rows 1-10 = Economy (30 seats)
    const seatMaps = [
        {
            id: 'sm-erj120-mixed', aircraftType: 'Embraer ERJ-120', rows: 10,
            columns: ['A', 'B', 'C'],
            exitRows: [5], premiumRows: [1, 2], blockedSeats: [],
            classMap: { business: { startRow: 1, endRow: 2 }, economy: { startRow: 3, endRow: 10 } },
        },
        {
            id: 'sm-erj120-economy', aircraftType: 'Embraer ERJ-120 (All Economy)', rows: 10,
            columns: ['A', 'B', 'C'],
            exitRows: [5], premiumRows: [], blockedSeats: [],
            classMap: { economy: { startRow: 1, endRow: 10 } },
        },
    ];

    const seatMapBatch = db.batch();
    for (const sm of seatMaps) {
        seatMapBatch.set(db.doc(`seatMaps/${sm.id}`), sm);
    }
    await seatMapBatch.commit();
    console.log(`   → ${seatMaps.length} seat maps created\n`);

    // ── 7. Seed Destinations ────────────────────────────────

    console.log('🏝️  Seeding destinations...');
    const destinations = [
        {
            id: 'dest-accra', city: 'Accra', country: 'Ghana', airportCode: 'ACC',
            airportName: 'Kotoka Intl Airport',
            description: 'Vibrant West African capital with rich culture, stunning beaches, and thriving arts scene.',
            imageUrl: 'https://images.unsplash.com/photo-1572551682073-8c8b4ce5ef2d?auto=format&fit=crop&q=80',
            highlights: ['Kwame Nkrumah Memorial', 'Labadi Beach', 'Makola Market', 'Cape Coast Castle'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Mar', isPromoted: true,
        },
        {
            id: 'dest-freetown', city: 'Freetown', country: 'Sierra Leone', airportCode: 'FNA',
            airportName: 'Lungi Intl Airport',
            description: 'Beautiful coastal city surrounded by mountains, known for pristine beaches and vibrant culture.',
            imageUrl: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&q=80',
            highlights: ['Lumley Beach', 'Cotton Tree', 'Tacugama Sanctuary', 'River No. 2 Beach'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Apr', isPromoted: true,
        },
        {
            id: 'dest-dakar', city: 'Dakar', country: 'Senegal', airportCode: 'DSS',
            airportName: 'Blaise Diagne Intl Airport',
            description: 'The vibrant capital of Senegal, perched on the Atlantic coast with colorful markets and rich musical heritage.',
            imageUrl: 'https://images.unsplash.com/photo-1591778328800-9eb18474ffdd?auto=format&fit=crop&q=80',
            highlights: ['Gorée Island', 'African Renaissance Monument', 'Sandaga Market', 'Lake Retba'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - May', isPromoted: true,
        },
        {
            id: 'dest-conakry', city: 'Conakry', country: 'Guinea', airportCode: 'CKY',
            airportName: 'Conakry Intl Airport',
            description: 'Capital of Guinea on the Atlantic coast, known for its bustling markets and vibrant music scene.',
            imageUrl: 'https://images.unsplash.com/photo-1580746738099-beada74e5e85?auto=format&fit=crop&q=80',
            highlights: ['National Museum', 'Botanical Gardens', 'Îles de Los', 'Grand Mosque'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Apr', isPromoted: false,
        },
        {
            id: 'dest-monrovia', city: 'Monrovia', country: 'Liberia', airportCode: 'ROB',
            airportName: 'Roberts Intl Airport',
            description: 'Coastal capital of Liberia with a unique American-African heritage and beautiful Atlantic beaches.',
            imageUrl: 'https://images.unsplash.com/photo-1580746738099-beada74e5e85?auto=format&fit=crop&q=80',
            highlights: ['Providence Island', 'National Museum', 'Waterside Market', 'Robertsport Beach'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Apr', isPromoted: false,
        },
    ];

    const destBatch = db.batch();
    for (const dest of destinations) {
        destBatch.set(db.doc(`destinations/${dest.id}`), {
            ...dest,
            createdAt: Timestamp.now(),
        });
    }
    await destBatch.commit();
    console.log(`   → ${destinations.length} destinations created\n`);

    // ── Email Templates ──────────────────────────────────────

    console.log('📧 Seeding email templates...');

    const emailTemplates = [
        {
            id: 'et-booking-confirm',
            name: 'Booking Confirmation',
            category: 'transactional',
            subject: 'Booking Confirmed — {{pnr}} | {{airlineName}}',
            htmlBody: `<h1>Booking Confirmed!</h1>
<p>Dear {{passengerName}},</p>
<p>Your booking has been successfully confirmed. Here are your details:</p>
<table>
<tr><td><strong>PNR:</strong></td><td>{{pnr}}</td></tr>
<tr><td><strong>Flight:</strong></td><td>{{flightNumber}}</td></tr>
<tr><td><strong>Route:</strong></td><td>{{route}}</td></tr>
<tr><td><strong>Date:</strong></td><td>{{departureDate}}</td></tr>
<tr><td><strong>E-Ticket:</strong></td><td>{{eTicketNumber}}</td></tr>
<tr><td><strong>Amount Paid:</strong></td><td>{{amountPaid}}</td></tr>
</table>
<p>Please present your e-ticket number or PNR at the check-in counter.</p>
<p>Thank you for choosing {{airlineName}}!</p>`,
            variables: ['passengerName', 'pnr', 'flightNumber', 'route', 'departureDate', 'eTicketNumber', 'amountPaid', 'airlineName'],
            status: 'live',
            version: 1,
            updatedBy: 'system',
        },
        {
            id: 'et-checkin-reminder',
            name: 'Check-In Reminder',
            category: 'transactional',
            subject: 'Check-In Now Open — {{flightNumber}} {{route}} | {{airlineName}}',
            htmlBody: `<h1>Online Check-In is Open!</h1>
<p>Dear {{passengerName}},</p>
<p>Your flight departs in less than 24 hours. Check in now to secure your seat.</p>
<table>
<tr><td><strong>PNR:</strong></td><td>{{pnr}}</td></tr>
<tr><td><strong>Flight:</strong></td><td>{{flightNumber}}</td></tr>
<tr><td><strong>Route:</strong></td><td>{{route}}</td></tr>
<tr><td><strong>Departure:</strong></td><td>{{departureDate}} at {{departureTime}}</td></tr>
</table>
<p>We look forward to welcoming you aboard!</p>`,
            variables: ['passengerName', 'pnr', 'flightNumber', 'route', 'departureDate', 'departureTime', 'airlineName'],
            status: 'live',
            version: 1,
            updatedBy: 'system',
        },
        {
            id: 'et-flight-status',
            name: 'Flight Status Change',
            category: 'operational',
            subject: 'Flight Update — {{flightNumber}} {{statusChange}} | {{airlineName}}',
            htmlBody: `<h1>Flight Status Update</h1>
<p>Dear {{passengerName}},</p>
<p>There has been a change to your flight:</p>
<table>
<tr><td><strong>PNR:</strong></td><td>{{pnr}}</td></tr>
<tr><td><strong>Flight:</strong></td><td>{{flightNumber}}</td></tr>
<tr><td><strong>Route:</strong></td><td>{{route}}</td></tr>
<tr><td><strong>Status:</strong></td><td>{{statusChange}}</td></tr>
<tr><td><strong>New Departure:</strong></td><td>{{newDepartureTime}}</td></tr>
</table>
<p>We apologize for any inconvenience. Please contact our support team if you need assistance.</p>`,
            variables: ['passengerName', 'pnr', 'flightNumber', 'route', 'statusChange', 'newDepartureTime', 'airlineName'],
            status: 'live',
            version: 1,
            updatedBy: 'system',
        },
    ];

    const etBatch = db.batch();
    for (const et of emailTemplates) {
        etBatch.set(db.doc(`emailTemplates/${et.id}`), {
            ...et,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }
    await etBatch.commit();
    console.log(`   → ${emailTemplates.length} email templates created`);

    // ── SMS Templates ────────────────────────────────────────

    console.log('📱 Seeding SMS templates...');

    const smsTemplates = [
        {
            id: 'sms-booking-confirm',
            name: 'Booking Confirmation',
            category: 'transactional',
            body: '{{airlineName}}: Booking {{pnr}} confirmed! Flight {{flightNumber}} {{route}} on {{departureDate}}. E-Ticket: {{eTicketNumber}}. Have a great flight!',
            variables: ['airlineName', 'pnr', 'flightNumber', 'route', 'departureDate', 'eTicketNumber'],
            status: 'live',
            provider: 'mock',
            maxLength: 320,
            updatedBy: 'system',
        },
        {
            id: 'sms-checkin-reminder',
            name: 'Check-In Reminder',
            category: 'transactional',
            body: '{{airlineName}}: Check in now for flight {{flightNumber}} {{route}} departing {{departureDate}} at {{departureTime}}. PNR: {{pnr}}.',
            variables: ['airlineName', 'pnr', 'flightNumber', 'route', 'departureDate', 'departureTime'],
            status: 'live',
            provider: 'mock',
            maxLength: 160,
            updatedBy: 'system',
        },
        {
            id: 'sms-flight-status',
            name: 'Flight Status Change',
            category: 'operational',
            body: '{{airlineName}} ALERT: Flight {{flightNumber}} {{route}} — {{statusChange}}. New departure: {{newDepartureTime}}. PNR: {{pnr}}.',
            variables: ['airlineName', 'pnr', 'flightNumber', 'route', 'statusChange', 'newDepartureTime'],
            status: 'live',
            provider: 'mock',
            maxLength: 160,
            updatedBy: 'system',
        },
    ];

    const smsBatch = db.batch();
    for (const sms of smsTemplates) {
        smsBatch.set(db.doc(`smsTemplates/${sms.id}`), {
            ...sms,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }
    await smsBatch.commit();
    console.log(`   → ${smsTemplates.length} SMS templates created\n`);

    // ── Summary ─────────────────────────────────────────────

    console.log('✅ Phase 0 seed complete! Collections seeded:');
    console.log(`   • users         (${TEST_USERS.length}) — with Auth accounts & custom claims`);
    console.log(`   • aircraft      (${AIRCRAFT.length})`);
    console.log(`   • routes        (${ROUTES.length})`);
    console.log(`   • flights       (${flights.length})`);
    console.log(`   • bookings      (${bookings.length}) — statuses: ${bookingStatuses.join(', ')}`);
    console.log(`   • seatMaps      (${seatMaps.length})`);
    console.log(`   • destinations  (${destinations.length})`);
    console.log(`   • emailTemplates (${emailTemplates.length})`);
    console.log(`   • smsTemplates  (${smsTemplates.length})`);
    console.log('\n🔧 Test Accounts:');
    for (const u of TEST_USERS) {
        console.log(`   ${u.role.padEnd(14)} → ${u.email} / ${u.password}`);
    }
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
