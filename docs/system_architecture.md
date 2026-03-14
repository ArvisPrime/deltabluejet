# DeltaBlue Jet Air — System Architecture & Design

**Version:** 1.0 — February 2026

---

## 1. Architecture Overview

### 1.1 Layered Architecture

```mermaid
graph TB
    subgraph "Layer 1 — Presentation"
        WEB["React SPA\n(Vite + React Router)"]
        MOB["Future: Mobile App\n(React Native)"]
    end

    subgraph "Layer 2 — Application / BFF"
        CF["Cloud Functions\n(Firebase)"]
        API["REST / Callable API"]
    end

    subgraph "Layer 3 — Domain Services"
        BMS["Booking\nManagement"]
        CMS_C["Customer\nManagement"]
        FOMS["Flight Operations\nManagement"]
        IFC["Inventory &\nFleet Config"]
        PAY["Payment\nProcessing"]
        SI["Sales\nIntelligence"]
        NTF["Notification\nEngine"]
        AUTH["Identity &\nAccess"]
        GC["Governance &\nCompliance"]
    end

    subgraph "Layer 4 — Data & Infrastructure"
        FS["Firestore\n(Primary DB)"]
        STORE["Cloud Storage\n(Media / PDFs)"]
        STRIPE["Stripe\n(Payments)"]
        SG["SendGrid\n(Email)"]
        TW["Twilio\n(SMS)"]
        PUBSUB["Cloud Pub/Sub\n(Events)"]
    end

    WEB --> CF
    MOB --> CF
    CF --> BMS & CMS_C & FOMS & IFC & PAY & SI & NTF & AUTH & GC
    BMS --> FS & PAY & NTF
    CMS_C --> FS
    FOMS --> FS & PUBSUB
    IFC --> FS
    PAY --> STRIPE & FS
    SI --> FS
    NTF --> SG & TW & FS
    AUTH --> FS
    GC --> FS & STORE
```

### 1.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite + React Router | Already in place, fast dev cycle |
| **State** | Zustand | Lightweight, already used (`authStore`, `bookingStore`, `flightsStore`) |
| **Styling** | Tailwind CSS + Custom CSS | Already in place |
| **Backend** | Firebase Cloud Functions (Node.js) | Serverless, scales to zero, GCP-native |
| **Database** | Firestore | Already in place, real-time sync, offline support |
| **Auth** | Firebase Authentication | Already in place, Google + Email providers |
| **Storage** | Cloud Storage for Firebase | Boarding passes, documents, media |
| **Payments** | Stripe | PCI-DSS compliant, global coverage |
| **Notifications** | SendGrid (email) + Twilio (SMS) | Industry standard, template support |
| **Events** | Cloud Pub/Sub | Decoupled event-driven architecture |
| **Monitoring** | Firebase Performance + Crashlytics | Built-in, zero-config |

---

## 2. Component Topology

### 2.1 Frontend Module Map

```mermaid
graph LR
    subgraph "Public Website"
        HOME["Landing Page"]
        DEST["Destinations"]
        ABOUT["About"]
        TRACK["Flight Tracker"]
    end

    subgraph "Booking Flow"
        SEARCH["Flight Search"]
        RESULTS["Flight Results"]
        FARE["Fare Selection"]
        PAX["Passenger Details"]
        SEATS["Seat Selection"]
        PAY_UI["Payment"]
        CONFIRM["Confirmation"]
    end

    subgraph "Customer Self-Service"
        LOGIN["Auth"]
        MANAGE["Manage Booking"]
        CHECKIN["Check-in Flow"]
        PROFILE["My Profile"]
        LOYALTY["Loyalty Dashboard"]
    end

    subgraph "Admin Dashboard"
        OPS["Flight Operations"]
        FLEET["Fleet & Inventory"]
        SALES["Sales Intelligence"]
        USERS["User Management"]
        CMS["CMS"]
        SEC["Security"]
        COMMS["Communications"]
    end

    HOME --> SEARCH
    SEARCH --> RESULTS --> FARE --> PAX --> SEATS --> PAY_UI --> CONFIRM
    LOGIN --> MANAGE
    LOGIN --> CHECKIN
    LOGIN --> PROFILE
```

### 2.2 Service Layer Architecture

| Service | Responsibility | Firestore Collections | Cloud Functions |
|---------|---------------|----------------------|-----------------|
| **BookingService** | Create, modify, cancel, retrieve | `bookings`, `bookings/{id}/passengers` | `createPaymentIntent`, `processRefund`, `sendBookingConfirmation` |
| **CheckinService** | PNR lookup, eligibility, seat conflict prevention, boarding pass | `checkins`, `bookings`, `flights` | `generateBoardingPass` |
| **FlightOpsService** | Flight lifecycle, gate assignment, delay management | `flights` | `updateFlightStatus`, `assignGate` |
| **InventoryService** | **NEW** — Route → aircraft → schedule publication | `routes`, `aircraft`, `flights`, `schedules` | `publishSchedule`, `withdrawFlight` |
| **PaymentService** | **NEW** — Stripe integration, reconciliation | `payments`, `bookings` | `handleStripeWebhook`, `reconcilePayments` |
| **CustomerService** | **NEW** — Profile, loyalty, preferences | `customers`, `loyalty` | `updateLoyaltyTier` |
| **SalesIntelService** | **NEW** — Aggregations, analytics | `sales_daily`, `route_performance` | `aggregateDailySales` |
| **NotificationService** | Email/SMS delivery, template rendering | `notification_logs`, `email_templates`, `sms_templates` | `sendNotification` |
| **AuditService** | Immutable action logging | `audit_logs` | (triggered by other services) |

---

## 3. Data Architecture

### 3.1 Entity Relationship Model

```mermaid
erDiagram
    CUSTOMER ||--o{ BOOKING : places
    CUSTOMER ||--o{ LOYALTY : has
    BOOKING ||--o{ PASSENGER : contains
    BOOKING ||--|| PAYMENT : requires
    BOOKING }o--|| FLIGHT : "books_on"
    FLIGHT }o--|| AIRCRAFT : "assigned_to"
    FLIGHT }o--|| ROUTE : "operates_on"
    ROUTE ||--|| AIRPORT_ORIGIN : from
    ROUTE ||--|| AIRPORT_DEST : to
    AIRCRAFT ||--|| SEAT_MAP : "configured_by"
    PASSENGER ||--o| CHECKIN : "checks_in"
    CHECKIN ||--o| BOARDING_PASS : generates
    FLIGHT ||--o{ SCHEDULE : "published_via"

    CUSTOMER {
        string uid PK
        string email
        string displayName
        string phone
        string tier
    }

    BOOKING {
        string id PK
        string pnr UK
        string customerId FK
        string flightId FK
        string status
        number totalAmount
    }

    FLIGHT {
        string id PK
        string flightNumber
        string routeId FK
        string aircraftId FK
        string status
        map seatsAvailable
    }

    AIRCRAFT {
        string id PK
        string registration UK
        string type
        map seatConfig
        string status
    }

    ROUTE {
        string id PK
        object origin
        object destination
        number distance_km
        boolean isActive
    }

    SCHEDULE {
        string id PK
        string routeId FK
        string aircraftId FK
        array daysOfWeek
        date effectiveFrom
        date effectiveTo
    }
```

### 3.2 Firestore Collection Topology

```
firestore-root/
├── customers/                    # NEW — Customer profiles
│   └── {uid}/
│       ├── profile fields...
│       └── savedTravelers/       # Sub-collection
│           └── {travelerId}/
├── loyalty/                      # NEW — Loyalty accounts
│   └── {uid}/
├── bookings/
│   └── {bookingId}/
│       └── passengers/           # Sub-collection (exists)
│           └── {passengerId}/
├── flights/                      # (exists) — enriched with schedule ref
│   └── {flightId}/
├── aircraft/                     # (exists) — enriched with maintenance
│   └── {aircraftId}/
├── routes/                       # (exists)
│   └── {routeId}/
├── schedules/                    # NEW — Published schedule templates
│   └── {scheduleId}/
├── seat_maps/                    # (exists)
│   └── {aircraftType}/
├── checkins/                     # (exists)
│   └── {checkinId}/
├── payments/                     # (exists) — enriched with reconciliation
│   └── {paymentId}/
├── notification_logs/            # (exists)
│   └── {logId}/
├── email_templates/              # (exists)
├── sms_templates/                # (exists)
├── audit_logs/                   # (exists)
│   └── {logId}/
├── sales_daily/                  # NEW — Daily sales aggregation
│   └── {YYYY-MM-DD}/
├── route_performance/            # NEW — Route analytics
│   └── {routeId}/
└── cms_config/                   # (exists)
    ├── header/
    ├── footer/
    └── about_values/
```

---

## 4. API Design

### 4.1 Cloud Functions Inventory

#### Booking Domain
| Function | Type | Input | Output |
|----------|------|-------|--------|
| `createPaymentIntent` | Callable | `{ bookingId, amount, currency }` | `{ clientSecret, paymentIntentId }` |
| `handleStripeWebhook` | HTTP | Stripe webhook payload | 200/400 |
| `processRefund` | Callable | `{ bookingId, amount }` | `{ refundId, status }` |
| `sendBookingConfirmation` | Callable | `{ bookingId, email }` | `{ success }` |

#### Check-in Domain
| Function | Type | Input | Output |
|----------|------|-------|--------|
| `generateBoardingPass` | Callable | `{ checkinId, bookingId, passengerId }` | `{ boardingPassUrl, boardingGroup }` |

#### Operations Domain
| Function | Type | Input | Output |
|----------|------|-------|--------|
| `publishSchedule` | Callable | `{ routeId, aircraftId, dates[], daysOfWeek[] }` | `{ flightIds[] }` |
| `withdrawFlight` | Callable | `{ flightId, reason }` | `{ success, affectedBookings }` |
| `updateFlightStatus` | Callable | `{ flightId, status }` | `{ success }` |
| `assignGate` | Callable | `{ flightId, gate, terminal }` | `{ success }` |
| `swapAircraft` | Callable | `{ flightId, newAircraftId }` | `{ success, seatRemapping }` |

#### Intelligence Domain
| Function | Type | Input | Output |
|----------|------|-------|--------|
| `aggregateDailySales` | Scheduled | (daily cron) | writes to `sales_daily` |
| `getDashboardStats` | Callable | `{ dateRange }` | `{ revenue, bookings, loadFactor, ... }` |

---

## 5. Event-Driven Architecture

```mermaid
flowchart LR
    subgraph "Events"
        E1["booking.created"]
        E2["booking.confirmed"]
        E3["booking.cancelled"]
        E4["flight.status_changed"]
        E5["flight.published"]
        E6["checkin.completed"]
        E7["payment.succeeded"]
        E8["payment.failed"]
    end

    subgraph "Subscribers"
        S1["Notification Engine"]
        S2["Sales Aggregator"]
        S3["Loyalty Engine"]
        S4["Audit Logger"]
        S5["Inventory Manager"]
    end

    E1 --> S1 & S4
    E2 --> S1 & S2 & S3 & S4
    E3 --> S1 & S2 & S5 & S4
    E4 --> S1 & S4
    E5 --> S4
    E6 --> S1 & S4
    E7 --> S2 & S3 & S4
    E8 --> S1 & S4
```

---

## 6. Security Architecture

| Layer | Control |
|-------|---------|
| **Authentication** | Firebase Auth (Email + Google), MFA for admin roles |
| **Authorization** | Role-based: `super_admin`, `ops_manager`, `crew_sched`, `cs_agent`, `customer` |
| **Data Protection** | Firestore Security Rules: customers read own data, admins read all |
| **Payment Security** | PCI-DSS via Stripe (no card data touches our servers) |
| **Audit** | All mutations logged to `audit_logs` with user, action, timestamp |
| **Transport** | HTTPS everywhere (Firebase Hosting enforces TLS) |
| **Session** | Firebase Auth tokens (1hr), refresh tokens, session monitor UI exists |

---

## 7. Deployment Topology

```mermaid
graph TB
    subgraph "Firebase Project"
        HOST["Firebase Hosting\n(React SPA)"]
        AUTH_FB["Firebase Auth"]
        FS_DB["Firestore"]
        STOR["Cloud Storage"]
        FUNC["Cloud Functions\n(Node.js 18)"]
    end

    subgraph "External Services"
        STR["Stripe"]
        SGRID["SendGrid"]
        TWIL["Twilio"]
    end

    subgraph "GCP Services"
        PS["Cloud Pub/Sub"]
        SCHED["Cloud Scheduler"]
        MON["Cloud Monitoring"]
    end

    HOST --> FUNC
    FUNC --> FS_DB & STOR & AUTH_FB
    FUNC --> STR & SGRID & TWIL
    FUNC --> PS
    SCHED --> FUNC
    MON --> FUNC & FS_DB
```
