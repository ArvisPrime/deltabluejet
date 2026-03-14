/**
 * Firestore Seed Data Script
 * Run with: node scripts/seed.js
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key.
 */

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize with service account key, or fall back to application default credentials
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath) {
    initializeApp({ credential: cert(require(serviceAccountPath)) });
} else {
    // Uses Firebase CLI credentials (run `firebase login` first)
    initializeApp({ projectId: 'deltablue-jet-air' });
}

const db = getFirestore();
const auth = getAuth();

// ─── Airports ──────────────────────────────────────────────
const AIRPORTS = {
    BJL: { code: 'BJL', name: 'Banjul Intl Airport', city: 'Banjul', country: 'The Gambia', timezone: 'Africa/Banjul' },
    DAK: { code: 'DSS', name: 'Blaise Diagne Intl Airport', city: 'Dakar', country: 'Senegal', timezone: 'Africa/Dakar' },
    ACC: { code: 'ACC', name: 'Kotoka Intl Airport', city: 'Accra', country: 'Ghana', timezone: 'Africa/Accra' },
    FNA: { code: 'FNA', name: 'Lungi Intl Airport', city: 'Freetown', country: 'Sierra Leone', timezone: 'Africa/Freetown' },
    CKY: { code: 'CKY', name: 'Conakry Intl Airport', city: 'Conakry', country: 'Guinea', timezone: 'Africa/Conakry' },
    DAC: { code: 'DAC', name: 'Hazrat Shahjalal Intl Airport', city: 'Dhaka', country: 'Bangladesh', timezone: 'Asia/Dhaka' },
    ROB: { code: 'ROB', name: 'Roberts Intl Airport', city: 'Monrovia', country: 'Liberia', timezone: 'Africa/Monrovia' },
    OXB: { code: 'OXB', name: 'Osvaldo Vieira Intl Airport', city: 'Bissau', country: 'Guinea-Bissau', timezone: 'Africa/Bissau' },
    LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
    JFK: { code: 'JFK', name: 'John F Kennedy Intl Airport', city: 'New York', country: 'United States', timezone: 'America/New_York' },
    DXB: { code: 'DXB', name: 'Dubai Intl Airport', city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
    IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
};

// ─── Aircraft Fleet ────────────────────────────────────────
const AIRCRAFT = [
    {
        id: 'ac-001', type: 'Boeing 737-800', registration: 'DB-7380', manufacturer: 'Boeing', model: '737-800',
        totalSeats: 189, seatConfig: { economy: 162, business: 24, first: 3 },
        range_km: 5665, status: 'active', homeBase: 'BJL',
    },
    {
        id: 'ac-002', type: 'Airbus A320neo', registration: 'DB-320N', manufacturer: 'Airbus', model: 'A320neo',
        totalSeats: 180, seatConfig: { economy: 150, business: 24, first: 6 },
        range_km: 6300, status: 'active', homeBase: 'BJL',
    },
    {
        id: 'ac-003', type: 'Boeing 787-9', registration: 'DB-7890', manufacturer: 'Boeing', model: '787-9 Dreamliner',
        totalSeats: 296, seatConfig: { economy: 232, business: 48, first: 16 },
        range_km: 14140, status: 'active', homeBase: 'BJL',
    },
    {
        id: 'ac-004', type: 'ATR 72-600', registration: 'DB-ATR6', manufacturer: 'ATR', model: '72-600',
        totalSeats: 72, seatConfig: { economy: 72, business: 0, first: 0 },
        range_km: 1528, status: 'active', homeBase: 'BJL',
    },
    {
        id: 'ac-005', type: 'Airbus A330-300', registration: 'DB-333X', manufacturer: 'Airbus', model: 'A330-300',
        totalSeats: 277, seatConfig: { economy: 210, business: 42, first: 25 },
        range_km: 11750, status: 'active', homeBase: 'BJL',
    },
    {
        id: 'ac-006', type: 'Boeing 737-800', registration: 'DB-7382', manufacturer: 'Boeing', model: '737-800',
        totalSeats: 189, seatConfig: { economy: 162, business: 24, first: 3 },
        range_km: 5665, status: 'maintenance', homeBase: 'ACC',
    },
];

// ─── Routes ────────────────────────────────────────────────
const ROUTES = [
    { origin: 'BJL', destination: 'ACC', distance_km: 1420, duration_minutes: 180 },
    { origin: 'BJL', destination: 'FNA', distance_km: 680, duration_minutes: 90 },
    { origin: 'BJL', destination: 'CKY', distance_km: 960, duration_minutes: 120 },
    { origin: 'BJL', destination: 'DAC', distance_km: 11000, duration_minutes: 780 },
    { origin: 'BJL', destination: 'ROB', distance_km: 1200, duration_minutes: 150 },
    { origin: 'BJL', destination: 'OXB', distance_km: 310, duration_minutes: 45 },
    { origin: 'BJL', destination: 'LHR', distance_km: 4570, duration_minutes: 360 },
    { origin: 'BJL', destination: 'JFK', distance_km: 7200, duration_minutes: 540 },
    { origin: 'BJL', destination: 'DXB', distance_km: 6800, duration_minutes: 480 },
    { origin: 'BJL', destination: 'IST', distance_km: 4900, duration_minutes: 390 },
    { origin: 'ACC', destination: 'LHR', distance_km: 5100, duration_minutes: 390 },
    { origin: 'ACC', destination: 'JFK', distance_km: 8500, duration_minutes: 600 },
];

// ─── Helper Functions ──────────────────────────────────────
function generatePNR() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function futureDate(daysFromNow, hours = 8, minutes = 0) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    return Timestamp.fromDate(d);
}

function pastDate(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return Timestamp.fromDate(d);
}

// ─── Main Seed Function ────────────────────────────────────
async function seed() {
    console.log('🌱 Starting Deltablue Jet Air seed...\n');

    // --- Seed Aircraft ---
    console.log('✈️  Seeding aircraft...');
    const batch1 = db.batch();
    for (const ac of AIRCRAFT) {
        batch1.set(db.doc(`aircraft/${ac.id}`), {
            ...ac,
            lastMaintenanceDate: pastDate(30),
            nextMaintenanceDate: futureDate(60),
            createdAt: Timestamp.now(),
        });
    }
    await batch1.commit();
    console.log(`   → ${AIRCRAFT.length} aircraft created`);

    // --- Seed Routes ---
    console.log('🗺️  Seeding routes...');
    const batch2 = db.batch();
    const routeIds = [];
    for (const route of ROUTES) {
        const id = `${route.origin}-${route.destination}`.toLowerCase();
        routeIds.push(id);
        batch2.set(db.doc(`routes/${id}`), {
            id,
            origin: AIRPORTS[route.origin],
            destination: AIRPORTS[route.destination],
            distance_km: route.distance_km,
            duration_minutes: route.duration_minutes,
            isActive: true,
            createdAt: Timestamp.now(),
        });
    }
    await batch2.commit();
    console.log(`   → ${ROUTES.length} routes created`);

    // --- Seed Flights (next 7 days) ---
    console.log('🛫 Seeding flights...');
    const flights = [];
    let flightCounter = 100;

    for (let day = 0; day < 7; day++) {
        for (const route of ROUTES) {
            flightCounter++;
            const flightNumber = `DB-${flightCounter}`;
            const aircraft = AIRCRAFT[Math.floor(Math.random() * 4)]; // Use first 4 active ones
            const departureHour = 6 + Math.floor(Math.random() * 14); // Between 6am and 8pm
            const departureTime = futureDate(day, departureHour, Math.floor(Math.random() * 4) * 15);

            const arrDate = new Date(departureTime.toDate().getTime() + route.duration_minutes * 60 * 1000);
            const arrivalTime = Timestamp.fromDate(arrDate);

            const statuses = ['scheduled', 'scheduled', 'scheduled', 'boarding', 'delayed'];
            const status = day === 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'scheduled';

            const flight = {
                id: `fl-${flightCounter}`,
                flightNumber,
                airline: 'Deltablue Jet Air',
                origin: AIRPORTS[route.origin],
                destination: AIRPORTS[route.destination],
                departureTime,
                arrivalTime,
                status,
                aircraft: { id: aircraft.id, type: aircraft.type, registration: aircraft.registration },
                gate: status === 'boarding' ? `G${Math.floor(Math.random() * 20) + 1}` : null,
                terminal: status === 'boarding' ? `T${Math.floor(Math.random() * 3) + 1}` : null,
                seatsAvailable: { ...aircraft.seatConfig },
                seatsTaken: { economy: 0, business: 0, first: 0 },
                baseFare: { economy: 250 + Math.floor(Math.random() * 200), business: 800 + Math.floor(Math.random() * 500), first: 2500 + Math.floor(Math.random() * 1500) },
                routeId: `${route.origin}-${route.destination}`.toLowerCase(),
                daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                delayMinutes: status === 'delayed' ? 30 + Math.floor(Math.random() * 90) : 0,
                cancellationReason: null,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            flights.push(flight);
        }
    }

    // Write flights in batches of 400 (Firestore limit is 500)
    for (let i = 0; i < flights.length; i += 400) {
        const batch = db.batch();
        const chunk = flights.slice(i, i + 400);
        for (const f of chunk) {
            batch.set(db.doc(`flights/${f.id}`), f);
        }
        await batch.commit();
    }
    console.log(`   → ${flights.length} flights created (7 days)`);

    // --- Seed Destinations ---
    console.log('🏝️  Seeding destinations...');
    const destinations = [
        {
            id: 'dest-accra', city: 'Accra', country: 'Ghana', airportCode: 'ACC', airportName: 'Kotoka Intl Airport',
            description: 'Vibrant West African capital with rich culture, stunning beaches, and thriving arts scene.',
            imageUrl: 'https://images.unsplash.com/photo-1572551682073-8c8b4ce5ef2d?auto=format&fit=crop&q=80',
            highlights: ['Kwame Nkrumah Memorial', 'Labadi Beach', 'Makola Market', 'Cape Coast Castle'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Mar', isPromoted: true,
        },
        {
            id: 'dest-freetown', city: 'Freetown', country: 'Sierra Leone', airportCode: 'FNA', airportName: 'Lungi Intl Airport',
            description: 'Beautiful coastal city surrounded by mountains, known for pristine beaches and vibrant culture.',
            imageUrl: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&q=80',
            highlights: ['Lumley Beach', 'Cotton Tree', 'Tacugama Sanctuary', 'River No. 2 Beach'],
            climate: 'Tropical', bestTimeToVisit: 'Nov - Apr', isPromoted: true,
        },
        {
            id: 'dest-london', city: 'London', country: 'United Kingdom', airportCode: 'LHR', airportName: 'Heathrow Airport',
            description: 'Iconic world capital blending centuries of history with cutting-edge modernity.',
            imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80',
            highlights: ['Big Ben', 'Buckingham Palace', 'Tower Bridge', 'West End Theatre'],
            climate: 'Temperate', bestTimeToVisit: 'Apr - Sep', isPromoted: true,
        },
        {
            id: 'dest-dubai', city: 'Dubai', country: 'UAE', airportCode: 'DXB', airportName: 'Dubai Intl Airport',
            description: 'Futuristic desert metropolis with world-record architecture and luxury experiences.',
            imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80',
            highlights: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah', 'Desert Safari'],
            climate: 'Arid', bestTimeToVisit: 'Nov - Mar', isPromoted: true,
        },
        {
            id: 'dest-istanbul', city: 'Istanbul', country: 'Turkey', airportCode: 'IST', airportName: 'Istanbul Airport',
            description: 'Transcontinental city bridging Europe and Asia, steeped in history and alive with culture.',
            imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80',
            highlights: ['Hagia Sophia', 'Grand Bazaar', 'Blue Mosque', 'Bosphorus Cruise'],
            climate: 'Mediterranean', bestTimeToVisit: 'Apr - Oct', isPromoted: false,
        },
        {
            id: 'dest-dhaka', city: 'Dhaka', country: 'Bangladesh', airportCode: 'DAC', airportName: 'Hazrat Shahjalal Intl Airport',
            description: 'The vibrant capital of Bangladesh, known for its rich culture, historic mosques, and bustling river life.',
            imageUrl: 'https://images.unsplash.com/photo-1567093583221-56ef57487971?auto=format&fit=crop&q=80',
            highlights: ['Lalbagh Fort', 'Ahsan Manzil', 'Sundarbans', 'Old Dhaka'],
            climate: 'Tropical monsoon', bestTimeToVisit: 'Oct - Mar', isPromoted: false,
        },
        {
            id: 'dest-newyork', city: 'New York', country: 'United States', airportCode: 'JFK', airportName: 'John F Kennedy Intl Airport',
            description: 'The city that never sleeps — iconic skyline, world-class dining, and unparalleled entertainment.',
            imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80',
            highlights: ['Statue of Liberty', 'Central Park', 'Times Square', 'Brooklyn Bridge'],
            climate: 'Humid subtropical', bestTimeToVisit: 'Apr - Jun, Sep - Nov', isPromoted: true,
        },
    ];

    const batch3 = db.batch();
    for (const dest of destinations) {
        batch3.set(db.doc(`destinations/${dest.id}`), {
            ...dest,
            createdAt: Timestamp.now(),
        });
    }
    await batch3.commit();
    console.log(`   → ${destinations.length} destinations created`);

    // --- Seed Sample Bookings ---
    console.log('🎫 Seeding sample bookings...');
    const sampleBookings = [];
    const sampleFlights = flights.slice(0, 10);
    for (const flight of sampleFlights) {
        const booking = {
            id: `bk-${flight.id}`,
            pnr: generatePNR(),
            userId: 'seed-user-001',
            flightId: flight.id,
            flightNumber: flight.flightNumber,
            status: 'confirmed',
            origin: flight.origin,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            fareClass: 'economy',
            totalAmount: flight.baseFare.economy,
            currency: 'USD',
            passengerCount: 1,
            contactEmail: 'demo@deltabluejet.com',
            contactPhone: '+220-777-1234',
            paymentIntentId: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };
        sampleBookings.push(booking);
    }

    const batch4 = db.batch();
    for (const bk of sampleBookings) {
        batch4.set(db.doc(`bookings/${bk.id}`), bk);
    }
    await batch4.commit();
    console.log(`   → ${sampleBookings.length} sample bookings created`);

    // --- Seed Seat Maps ---
    console.log('💺 Seeding seat maps...');
    const seatMaps = [
        {
            id: 'sm-737-800', aircraftType: 'Boeing 737-800', rows: 33, columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            exitRows: [12, 13], premiumRows: [1, 2, 3], blockedSeats: [],
            classMap: { first: { startRow: 1, endRow: 3 }, business: { startRow: 4, endRow: 7 }, economy: { startRow: 8, endRow: 33 } },
        },
        {
            id: 'sm-a320neo', aircraftType: 'Airbus A320neo', rows: 31, columns: ['A', 'B', 'C', 'D', 'E', 'F'],
            exitRows: [11, 12], premiumRows: [1, 2, 3], blockedSeats: [],
            classMap: { first: { startRow: 1, endRow: 2 }, business: { startRow: 3, endRow: 6 }, economy: { startRow: 7, endRow: 31 } },
        },
        {
            id: 'sm-787-9', aircraftType: 'Boeing 787-9', rows: 42, columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'],
            exitRows: [20, 21], premiumRows: [1, 2, 3, 4], blockedSeats: [],
            classMap: { first: { startRow: 1, endRow: 4 }, business: { startRow: 5, endRow: 12 }, economy: { startRow: 13, endRow: 42 } },
        },
    ];

    const batch5 = db.batch();
    for (const sm of seatMaps) {
        batch5.set(db.doc(`seatMaps/${sm.id}`), sm);
    }
    await batch5.commit();
    console.log(`   → ${seatMaps.length} seat maps created`);

    console.log('\n✅ Seed complete! Collections created:');
    console.log('   • aircraft (6)');
    console.log(`   • routes (${ROUTES.length})`);
    console.log(`   • flights (${flights.length})`);
    console.log(`   • destinations (${destinations.length})`);
    console.log(`   • bookings (${sampleBookings.length})`);
    console.log(`   • seatMaps (${seatMaps.length})`);
}

seed().catch(console.error);
