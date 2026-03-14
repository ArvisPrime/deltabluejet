# DeltaBlue Jet Air — Product Requirements Document (PRD)

**Version:** 1.0 — February 2026
**Author:** Engineering Team
**Status:** Draft — Awaiting Stakeholder Approval

---

## 1. Vision & Problem Statement

**Vision:** Transform DeltaBlue Jet Air from a front-end MVP into a **production-grade, full-stack Airline Management System** capable of powering end-to-end airline operations — from flight planning and inventory creation to customer booking, payment processing, check-in, and post-flight analytics.

**Problem:** The current MVP delivers a polished customer-facing booking experience but lacks the operational backbone required for a functioning airline:

| Area | Current State | Target State |
|------|--------------|--------------|
| **Customer Management** | Auth + basic profile | Full CRM with loyalty, history, preferences |
| **Booking Management** | UI-complete flow | End-to-end flow with real inventory deduction |
| **Payment Processing** | Stripe stubs (callable only) | Live payment gateway with reconciliation |
| **Flight Operations** | Static UI pages | Real-time flight lifecycle management |
| **Inventory & Fleet** | Static aircraft docs | Dynamic fleet ↔ route ↔ schedule assignment |
| **Sales Intelligence** | None | BI dashboards, revenue analytics, yield management |
| **Governance** | None | Regulatory compliance, flight planning foundation |

---

## 2. Current System Inventory

### 2.1 Feature Modules (13)
`auth`, `booking` (14 pages), `checkin` (5 pages), `flights` (4 pages), `operations` (8 pages), `destinations` (3 pages), `cms` (6 pages), `communications` (4 pages), `security` (5 pages), `users` (3 pages), `dashboard`, `experiments`, `about`

### 2.2 Service Layer
| Service | Purpose | Completeness |
|---------|---------|-------------|
| `booking.ts` | Create, modify, cancel, retrieve bookings | ✅ Core complete |
| `checkin.ts` | PNR lookup, seat selection, boarding pass | ✅ Core complete |
| `firestore.ts` | CRUD for flights, aircraft, routes, bookings | ✅ Read-heavy |
| `auth.ts` | Firebase Auth wrapper | ✅ Complete |
| `cms.ts` | Header/footer/page content management | ✅ Complete |
| `notifications.ts` | Email/SMS template delivery | ⚠️ Templates only |

### 2.3 Data Models (firestore.ts)
`FlightDoc`, `AircraftDoc`, `RouteDoc`, `BookingDoc`, `PassengerDoc`, `SeatMapDoc`, `CheckinDoc`, `PaymentDoc`, `AuditLogDoc`, `UserDoc`, `EmailTemplateDoc`, `SmsTemplateDoc`, `NotificationLogDoc`, `CmsPageDoc`, `CmsHeaderConfigDoc`, `CmsFooterConfigDoc`, `DestinationDoc`

### 2.4 Cloud Functions (Stubs)
`createPaymentIntent`, `processRefund`, `sendBookingConfirmation`, `generateBoardingPass`, `setUserRole`, `updateFlightStatus`, `assignGate`, `swapAircraft`, `getDashboardStats`

---

## 3. Core Modules

### Module 1: Customer Management System (CMS-Cust)

**Purpose:** Central profile for every user who enters the system.

| Requirement | Priority | Description |
|-------------|----------|-------------|
| CMS-C01 | P0 | **Customer Profile Store** — name, email, phone, nationality, document, travel preferences |
| CMS-C02 | P0 | **Booking History** — all past and upcoming bookings linked to profile |
| CMS-C03 | P1 | **Loyalty Program** — "Deltablue Club" tier system (Blue → Silver → Gold → Platinum) |
| CMS-C04 | P1 | **Saved Travelers** — store frequent co-travelers for fast re-booking |
| CMS-C05 | P2 | **Preference Engine** — meal, seat, notification channel preferences |
| CMS-C06 | P2 | **Communication Opt-in/out** — GDPR-compliant marketing consent |

---

### Module 2: Booking Management System (BMS)

**Purpose:** The transactional engine that converts browsing into confirmed tickets.

#### 2A — Customer-Facing (Frontend Module)

| Requirement | Priority | Description |
|-------------|----------|-------------|
| BMS-F01 | P0 | **Flight Search** — origin/dest/date/pax/class with one-way, round-trip, multi-city |
| BMS-F02 | P0 | **Real-Time Availability** — query actual seat inventory, not static data |
| BMS-F03 | P0 | **Fare Selection** — display fare families (Economy, Business, First) with ancillaries |
| BMS-F04 | P0 | **Passenger Collection** — multi-pax forms with document validation |
| BMS-F05 | P0 | **Seat Selection** — live seat map with real-time conflict prevention |
| BMS-F06 | P0 | **PNR Generation** — 6-char unique booking reference |
| BMS-F07 | P1 | **Multi-City Booking** — chain multiple segments into a single PNR |
| BMS-F08 | P1 | **Ancillary Products** — add baggage, meals, priority boarding |
| BMS-F09 | P2 | **Group Booking** — 10+ passengers with special fare logic |

#### 2B — Payment Processing (Backend Module)

| Requirement | Priority | Description |
|-------------|----------|-------------|
| BMS-P01 | P0 | **Payment Gateway Integration** — Stripe live mode with card, mobile money |
| BMS-P02 | P0 | **Payment Status Sync** — real-time status writeback to booking record |
| BMS-P03 | P0 | **Ticketing on Payment** — auto-confirm booking + issue e-ticket on successful payment |
| BMS-P04 | P0 | **Booking Confirmation Email** — triggered on payment success with PNR + itinerary |
| BMS-P05 | P1 | **Refund Processing** — automated refund workflows based on fare rules |
| BMS-P06 | P1 | **Payment Reconciliation** — daily settlement report matching payments to bookings |
| BMS-P07 | P2 | **Instalment Payments** — pay-later option for high-value bookings |

---

### Module 3: Flight Operations Management System (FOMS)

**Purpose:** The operational heart — manages the physical reality of flights.

| Requirement | Priority | Description |
|-------------|----------|-------------|
| FOMS-01 | P0 | **Flight Schedule CRUD** — create/edit/cancel scheduled flights with recurrence |
| FOMS-02 | P0 | **Flight Status Lifecycle** — scheduled → boarding → departed → in_air → landed → arrived |
| FOMS-03 | P0 | **Gate & Terminal Assignment** — assign/reassign gates with conflict detection |
| FOMS-04 | P0 | **Delay Management** — record delay reason, auto-notify affected passengers |
| FOMS-05 | P1 | **Disruption Resolution** — cancel/reroute/accommodate affected passengers |
| FOMS-06 | P1 | **Crew Assignment** — link crew to flights (foundation only) |
| FOMS-07 | P2 | **Weight & Balance** — basic load planning per flight |

---

### Module 4: Inventory & Fleet Configuration (IFC)

**Purpose:** The physical inventory — what aircraft exist, their configurations, and how they map to routes and schedules.

| Requirement | Priority | Description |
|-------------|----------|-------------|
| IFC-01 | P0 | **Aircraft Registry** — type, registration, seats, range, weight limits, status |
| IFC-02 | P0 | **Seat Configuration Manager** — define layout per aircraft type (class → row range → seat letters) |
| IFC-03 | P0 | **Route Management** — origin/dest pairs with distance, duration, active status |
| IFC-04 | P0 | **Route ↔ Aircraft Assignment** — assign specific tail to specific route + date |
| IFC-05 | P0 | **Inventory Publication** — route + aircraft + schedule → published flight for sale |
| IFC-06 | P1 | **Maintenance Scheduling** — flag aircraft as unavailable during maintenance windows |
| IFC-07 | P1 | **Aircraft Swap** — reassign aircraft to a flight with automatic seat re-mapping |
| IFC-08 | P2 | **Fleet Utilization Dashboard** — hours flown, cycles, utilization % per tail |

> [!IMPORTANT]
> **The Inventory Publication Pipeline (IFC-05) is the critical missing link.** It is the process where:
> 1. A **route** is selected (e.g. BJL → DKR)
> 2. A **physical aircraft** is assigned to that route on a specific date
> 3. The route + aircraft + schedule **merge** into a published `FlightDoc`
> 4. That flight becomes visible in the **Booking Management System** for customers to purchase

---

### Module 5: Sales Intelligence & Business Intelligence (SI-BI)

**Purpose:** The intelligence layer that sits between operations and revenue.

| Requirement | Priority | Description |
|-------------|----------|-------------|
| SI-01 | P0 | **Sales Dashboard** — bookings by route/day/class, revenue totals, conversion funnel |
| SI-02 | P0 | **Inventory Status Board** — per flight: sold / available / pending / cancelled |
| SI-03 | P1 | **Revenue Analytics** — revenue per available seat-km (RASK), load factor trends |
| SI-04 | P1 | **Route Performance** — profitability ranking, underperforming routes |
| SI-05 | P2 | **Dynamic Pricing Engine** — adjust fares based on demand, time-to-departure, load factor |
| SI-06 | P2 | **Forecasting** — demand prediction using historical booking data |

---

### Module 6: Governance & Compliance (GC)

**Purpose:** Regulatory foundation for airline operations.

| Requirement | Priority | Description |
|-------------|----------|-------------|
| GC-01 | P1 | **Passenger Manifest** — regulatory manifest export (API-ready) |
| GC-02 | P1 | **Audit Trail** — immutable log of all system actions (already partially implemented) |
| GC-03 | P2 | **Flight Planning Foundation** — basic fuel, route, altitude planning data |
| GC-04 | P2 | **Regulatory Reporting** — standard aviation authority report templates |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Flight search < 500ms, seat map load < 300ms, payment processing < 3s |
| **Scalability** | Support 10K concurrent users, 500 flights/day, 50K bookings/day |
| **Availability** | 99.9% uptime for booking and check-in flows |
| **Security** | PCI-DSS for payments, GDPR for customer data, MFA for admin access |
| **Data Integrity** | Firestore transactions for all inventory-touching operations (no double-booking) |
| **Observability** | Structured logging, error tracking, performance monitoring |

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Booking completion rate | > 65% of searches → confirmed booking |
| Payment success rate | > 95% |
| Check-in digital adoption | > 80% online check-in |
| System uptime | > 99.9% |
| Average booking flow time | < 4 minutes |
| Customer satisfaction (CSAT) | > 4.5/5 |
