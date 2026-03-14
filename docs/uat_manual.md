# DeltaBlue Jet Air — UAT Manual

**Version:** 1.0 — February 2026  
**Live URL:** [https://deltablue-jet-air.web.app](https://deltablue-jet-air.web.app)  
**Companion Docs:** [Service Design](./service_design.md) · [SDLC Personas](./sdlc_personas.md) · [Phased Plan](./phased_implementation_plan.md)

---

## 1. Purpose & Scope

This document provides **step-by-step, persona-based test journeys** for User Acceptance Testing of the DeltaBlue Jet Air system. Each journey is written as a narrative walkthrough that a tester follows in the browser, with explicit **expected results** at every step.

### How to Use This Manual

1. **Assign personas** — each tester takes one or more persona roles
2. **Follow the journey** — execute each step in order on the live URL
3. **Mark results** — use the ✅ / ❌ columns to log pass/fail
4. **Log defects** — note any deviation from expected result with a screenshot
5. **Sign off** — each persona journey requires tester + PO sign-off

### Test Accounts Required

| Persona | Role | Email | Notes |
|---------|------|-------|-------|
| Aisha Jallow | `customer` | aisha@test.com | Leisure traveler |
| Omar Faye | `customer` | omar@test.com | Business traveler, Gold tier loyalty |
| Lamin Sanneh | `ops_manager` | lamin@test.com | Operations Manager |
| Abdou Touray | `super_admin` | abdou@test.com | CEO / Super Admin |

> [!IMPORTANT]
> Create these test accounts in Firebase Auth before beginning UAT. Ensure Lamin and Abdou have their respective roles set in Firestore `users` collection.

---

## 2. Pre-Flight Checklist

Before starting UAT, verify the following:

| # | Check | How to Verify | Pass |
|---|-------|---------------|------|
| 1 | App loads at production URL | Navigate to `https://deltablue-jet-air.web.app` — homepage renders | ☐ |
| 2 | Test accounts exist | Sign in with each test email — login succeeds | ☐ |
| 3 | Seed data present | At least 1 aircraft, 1 route, 1 published schedule with flights exist | ☐ |
| 4 | Admin dashboard accessible | Login as Lamin → `/admin` loads dashboard | ☐ |
| 5 | Firebase Console accessible | Can view Firestore collections in browser | ☐ |

---

## 3. Journey A — Aisha (Leisure Traveler): Search, Book & Check In

**Tester Role:** Customer  
**Objective:** Complete a full booking-to-boarding-pass flow  
**Estimated Time:** 20 minutes

---

### A1. Discovery & Navigation

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A1.1 | Open homepage | `/` | Hero banner, search widget, and navigation bar render. DeltaBlue branding visible. | ☐ |
| A1.2 | Click "Destinations" in nav | `/destinations` | Destinations grid loads with route cards showing origin → destination, images, and prices. | ☐ |
| A1.3 | Click any destination card | `/destinations/:id` | Destination detail page opens with route information, flight frequency, and "Book Now" CTA. | ☐ |
| A1.4 | Click "About" in nav | `/about` | About page loads with company values and team information. | ☐ |

---

### A2. Flight Search

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A2.1 | Navigate to booking | `/book` | Flight search form appears with origin, destination, date, passenger count, and trip type selectors. | ☐ |
| A2.2 | Enter origin: **BJL** | — | Airport code accepted, autocomplete or validation passes. | ☐ |
| A2.3 | Enter destination: **DKR** | — | Airport code accepted. | ☐ |
| A2.4 | Select a future date with available flights | — | Date picker allows selection. | ☐ |
| A2.5 | Set passengers to **1** | — | Passenger count set. | ☐ |
| A2.6 | Click **Search Flights** | `/book/results` | Search results page loads. Available flights display with flight number, departure/arrival times, and base fare. If no flights, "No flights available" message shows. | ☐ |

**Edge Case Tests:**
| # | Scenario | Expected Result | Pass |
|---|----------|-----------------|------|
| A2.E1 | Search with past date | Validation error or no results | ☐ |
| A2.E2 | Search with same origin and destination | Validation error | ☐ |
| A2.E3 | Search for route with no flights | "No flights available" message | ☐ |

---

### A3. Fare Selection & Passenger Details

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A3.1 | Select a flight from results | — | Flight highlighted/selected. | ☐ |
| A3.2 | View fare classes | `/book/fare` | Fare class cards display (Economy, Premium Economy, Business, First where applicable) with price, baggage allowance, and change policy for each. | ☐ |
| A3.3 | Select **Economy** fare | — | Economy fare selected, total updates. | ☐ |
| A3.4 | Proceed to passenger details | `/book/passengers` | Passenger form renders with fields: title, first name, last name, date of birth, nationality, passport/ID number. | ☐ |
| A3.5 | Fill in all required fields | — | Form accepts valid input. All fields validate on blur. | ☐ |
| A3.6 | Leave a required field empty and try to proceed | — | Validation error highlights the empty field. Cannot proceed. | ☐ |
| A3.7 | Fill all fields correctly and continue | — | Passenger data saved, proceeds to next step. | ☐ |

---

### A4. Seat Selection

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A4.1 | View seat map | `/book/seats` | Aircraft seat map renders showing available (selectable), occupied (greyed out), and premium seats. Legend explains colors. | ☐ |
| A4.2 | Click an available seat (e.g., **14A**) | — | Seat highlights as selected. Seat number displays in selection summary. | ☐ |
| A4.3 | Change seat selection | — | Previous seat deselects, new seat highlights. | ☐ |
| A4.4 | Proceed with selected seat | — | Selection confirmed, moves to payment. | ☐ |

---

### A5. Payment

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A5.1 | View payment page | `/book/payment` | Payment summary shows: flight details, passenger name, fare breakdown, total amount. Stripe card input renders. | ☐ |
| A5.2 | Verify fare breakdown | — | Base fare + taxes + seat fee (if applicable) = Total. Currency is correct. | ☐ |
| A5.3 | Enter test card: `4242 4242 4242 4242`, any future expiry, any CVC | — | Stripe Elements accepts card number without error. | ☐ |
| A5.4 | Click **Pay Now** | — | Loading spinner appears. After 3–10 seconds, redirects to confirmation. | ☐ |
| A5.5 | View confirmation | `/book/confirmation` | Ticket confirmation page shows: ✅ checkmark, PNR code (6-character alphanumeric), flight details, passenger name, seat number, fare paid. | ☐ |

**Edge Case Tests:**
| # | Scenario | Expected Result | Pass |
|---|----------|-----------------|------|
| A5.E1 | Declined card: `4000 0000 0000 0002` | Error message: "Card declined". Stays on payment page. | ☐ |
| A5.E2 | Refresh confirmation page | PNR and details persist (not lost). | ☐ |

---

### A6. Manage Booking

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A6.1 | Navigate to Manage Booking | `/manage-booking` | PNR retrieval form renders with PNR and Last Name fields. | ☐ |
| A6.2 | Enter the PNR from step A5.5 and last name | — | Form accepts input. | ☐ |
| A6.3 | Click **Retrieve Booking** | `/manage-booking/:pnr` | Booking detail page loads showing: flight info, passenger list, seat assignments, booking status (confirmed), payment status. | ☐ |
| A6.4 | Click **Modify Booking** | `/manage-booking/:pnr/modify` | Modification search shows alternative flights for the same route. | ☐ |

**Edge Case Tests:**
| # | Scenario | Expected Result | Pass |
|---|----------|-----------------|------|
| A6.E1 | Enter invalid PNR | "Booking not found" error message | ☐ |
| A6.E2 | Enter correct PNR but wrong last name | "Booking not found" or access denied | ☐ |

---

### A7. Online Check-In

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A7.1 | Navigate to Check-in | `/checkin` | Check-in retrieval form with PNR + Last Name fields. | ☐ |
| A7.2 | Enter PNR and last name | — | Form accepts input. | ☐ |
| A7.3 | Submit | `/checkin/passengers` | Passenger selection screen shows all passengers on the booking with checkboxes. | ☐ |
| A7.4 | Select passenger(s) to check in | — | Passenger(s) selected. Continue button enabled. | ☐ |
| A7.5 | Continue to declaration | `/checkin/declaration` | Health & safety declaration form renders with required checkboxes/acknowledgements. | ☐ |
| A7.6 | Accept all declarations | — | All boxes checked. Continue enabled. | ☐ |
| A7.7 | Continue to seat confirmation | `/checkin/seats` | Seat confirmation or change screen. Previously selected seat shown. | ☐ |
| A7.8 | Confirm seat and complete check-in | `/checkin/success` | Success page: ✅ "Check-in Complete", boarding pass preview with QR code / barcode, option to download/print. | ☐ |

**Edge Case Tests:**
| # | Scenario | Expected Result | Pass |
|---|----------|-----------------|------|
| A7.E1 | Check-in for a flight > 48h away | Error: "Check-in opens 48 hours before departure" | ☐ |
| A7.E2 | Check-in for already checked-in passenger | Shows "Already checked in" status | ☐ |

---

### A8. Flight Status Tracker

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A8.1 | Navigate to Flight Tracker | `/flight-status` | Flight status search form with flight number and/or date fields. | ☐ |
| A8.2 | Enter a valid flight number | — | Search submitted. | ☐ |
| A8.3 | View results | `/flight-status/results` | Flight status card shows: flight number, route, scheduled times, actual times (if available), status (On Time / Delayed / Cancelled), gate assignment. | ☐ |

---

### A9. Loyalty Dashboard

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| A9.1 | Login as Aisha | — | Authenticated successfully. | ☐ |
| A9.2 | Navigate to Loyalty | `/loyalty` | Loyalty dashboard shows: current tier (Blue/Silver/Gold/Platinum), points balance, progress bar to next tier, points history table, tier benefits list. | ☐ |
| A9.3 | Verify points from booking | — | Points entry visible in history matching the booking from Journey A. | ☐ |

---

## 4. Journey B — Omar (Business Traveler): Book, Modify, Multi-City

**Tester Role:** Customer (frequent flyer)  
**Objective:** Test business traveler flow including modification and multi-city  
**Estimated Time:** 25 minutes

---

### B1. Standard Booking (Business Class)

| Step | Action | Expected Result | Pass |
|------|--------|-----------------|------|
| B1.1 | Login as Omar | Dashboard or homepage loads, user authenticated. | ☐ |
| B1.2 | Search flights BJL → DKR, select future date | Results display available flights. | ☐ |
| B1.3 | Select **Business** fare class | Higher fare displayed with business perks (extra baggage, lounge, flexible changes). | ☐ |
| B1.4 | Complete passenger details | Business traveler details accepted. | ☐ |
| B1.5 | Select premium seat (row 1–4) | Premium seat selectable, possible surcharge shown. | ☐ |
| B1.6 | Complete payment with test card | Confirmation page with PNR, business class ticket details. | ☐ |

---

### B2. Booking Modification

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| B2.1 | Go to Manage Booking | `/manage-booking` | Retrieval form renders. | ☐ |
| B2.2 | Enter PNR from B1.6 | — | Booking detail loads showing confirmed business class booking. | ☐ |
| B2.3 | Click **Modify Booking** | `/manage-booking/:pnr/modify` | Alternative flights displayed for same route. | ☐ |
| B2.4 | Select a different flight | — | New flight selected. | ☐ |
| B2.5 | Review change | `/manage-booking/:pnr/review-change` | Change summary shows: original flight, new flight, fare difference (charge or refund), change policy details. | ☐ |
| B2.6 | Confirm change | `/manage-booking/:pnr/change-success` | Success message: "Booking modified successfully." Updated booking details shown. | ☐ |

---

### B3. Multi-City Booking

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| B3.1 | Navigate to Multi-City | `/book/multi-city` | Multi-city search form with 2 default legs (origin, destination, date per leg). Step indicator shows "Search". | ☐ |
| B3.2 | Fill Leg 1: BJL → DKR, select date | — | Inputs accepted, airport codes validated. | ☐ |
| B3.3 | Fill Leg 2: DKR → ACC, select later date | — | Inputs accepted. | ☐ |
| B3.4 | Click **Add Leg** | — | Third leg row appears. Form now has 3 legs. | ☐ |
| B3.5 | Fill Leg 3: ACC → BJL, select later date | — | All 3 legs filled. | ☐ |
| B3.6 | Click **Search Flights** | — | Step changes to "Select Flights". Each leg shows available flights grouped by leg number. | ☐ |
| B3.7 | Select one flight per leg | — | Each selected flight shows ✅ "Selected" badge. After all legs selected, automatically moves to Summary. | ☐ |
| B3.8 | Review fare summary | — | Itinerary timeline shows: Leg 1 → Leg 2 → Leg 3 with flight numbers. Fare breakdown shows per-leg fares, subtotal, **5% multi-city discount** (for 3+ legs), and total. | ☐ |
| B3.9 | Verify discount calculation | — | Discount = subtotal × 5%. Total = subtotal − discount. Math is correct. | ☐ |

**Edge Case Tests:**
| # | Scenario | Expected Result | Pass |
|---|----------|-----------------|------|
| B3.E1 | Try to add 5th leg (max is 4) | "Add Leg" button disabled or hidden. | ☐ |
| B3.E2 | Remove a leg to go below 2 | Remove button disabled or hidden when only 2 legs remain. | ☐ |
| B3.E3 | 2 legs only (no discount) | 0% discount, total equals subtotal. | ☐ |
| B3.E4 | Search with a leg having no flights | "No flights available on [date]" message for that leg. | ☐ |

---

## 5. Journey C — Lamin (Operations Manager): Fleet, Schedule, Disruptions

**Tester Role:** `ops_manager`  
**Objective:** Test the full admin operational workflow  
**Estimated Time:** 30 minutes

---

### C1. Admin Dashboard Access

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C1.1 | Login as Lamin (ops_manager) | — | Login succeeds. Redirected to admin dashboard. | ☐ |
| C1.2 | View Dashboard | `/admin` | Admin dashboard loads with KPI cards: total bookings, revenue, flights today, load factor. Navigation sidebar shows all admin menu items. | ☐ |

---

### C2. Fleet Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C2.1 | Navigate to Fleet Management | `/admin/fleet` | Fleet registry page loads with list/grid of aircraft. Each card shows registration, type, total seats, status (active/maintenance/retired). | ☐ |
| C2.2 | Click an aircraft card | — | Aircraft detail expands or opens: full specifications, maintenance log, seat configuration breakdown by class. | ☐ |
| C2.3 | Verify seat configuration totals | — | Sum of Economy + Premium Economy + Business + First = total seats shown on card. | ☐ |

---

### C3. Route Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C3.1 | Navigate to Route Management | `/admin/routes` | Route list displays all configured routes with origin, destination, distance, status. | ☐ |
| C3.2 | Click to view/edit a route | — | Route detail shows: airport pair, distance in km/nm, base fares by class, estimated flight time. | ☐ |

---

### C4. Flight Scheduling & Publication

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C4.1 | Navigate to Scheduling | `/admin/scheduling` | Schedule management page loads with existing schedules and "Create Schedule" option. | ☐ |
| C4.2 | View or create a schedule | — | Schedule form shows: route selector, aircraft selector, days of week (checkboxes), departure time, arrival time, effective date range. | ☐ |
| C4.3 | Create a schedule for BJL → DKR, Mon/Wed/Fri | — | Schedule created. Preview shows generated flight instances within the date range. | ☐ |
| C4.4 | Publish the schedule | — | Flights generated and published. Status changes to "active". Flight count updates. | ☐ |
| C4.5 | Verify: search these flights as a customer | `/book` | New published flights appear in customer search results for the scheduled dates. | ☐ |

---

### C5. Gate Assignment

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C5.1 | Navigate to Gate Assignment | `/admin/gates` | Gate assignment view shows flights with gate status (assigned/unassigned). | ☐ |
| C5.2 | Assign a gate to a flight | — | Gate number saved. Flight card updates with gate. | ☐ |

---

### C6. Disruption Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C6.1 | Navigate to Manage Delays | `/admin/delays` | Delay management interface loads with a list of today's flights. | ☐ |
| C6.2 | Select a flight and enter a delay (e.g., 2 hours) | — | Delay form accepts reason, new estimated departure time. | ☐ |
| C6.3 | Submit delay | — | Flight status updates to "delayed". New departure time reflected. | ☐ |
| C6.4 | Navigate to Disruption Resolution | `/admin/disruptions` | Disruption dashboard shows current disruptions with severity indicators. | ☐ |
| C6.5 | Navigate to Aircraft Swap | `/admin/aircraft-swap` | Aircraft swap interface loads, allows reassigning aircraft to flights. | ☐ |

---

### C7. Regulatory Manifest

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C7.1 | Navigate to Regulatory Manifest | `/admin/manifest` | Manifest page loads with flight selector dropdown. | ☐ |
| C7.2 | Select a flight with bookings | — | Passenger manifest table generates with columns: passenger name (LAST, FIRST), nationality, document type, document number, DOB, PNR, seat, fare class, boarding status, APIS compliance. | ☐ |
| C7.3 | Verify summary stats | — | Header shows: total passengers, checked-in count, verified documents count. Numbers match table rows. | ☐ |
| C7.4 | Search within manifest | — | Filter input narrows table to matching passenger name or PNR. | ☐ |
| C7.5 | Click **Export CSV** | — | CSV file downloads. Open in Excel/Sheets — columns match table, data intact. | ☐ |

---

### C8. Audit Log

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C8.1 | Navigate to Audit Log | `/admin/alerts` | Audit log page loads with log entries table and filter controls. | ☐ |
| C8.2 | Verify log entries exist | — | Table shows: timestamp, user email, action, module, severity, description. Recent actions from this UAT session appear. | ☐ |
| C8.3 | Filter by module (e.g., "Bookings") | — | Table filters to only show booking-related entries. | ☐ |
| C8.4 | Filter by severity (e.g., "warning") | — | Table filters to show only warning-level entries. | ☐ |
| C8.5 | Enter search text | — | Text search filters entries by description or action content. | ☐ |
| C8.6 | Click **Export Report** | — | CSV downloads with filtered log data. | ☐ |
| C8.7 | Verify 24h stats panel | — | Stats cards show: total events, warnings, errors, critical — numbers consistent with visible log entries. | ☐ |

---

### C9. Operational Notifications & Triggers

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C9.1 | Navigate to Operational Triggers | `/admin/triggers` | Trigger configuration page loads. | ☐ |

---

### C10. Seat Map CMS

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| C10.1 | Navigate to Seat Map CMS | `/admin/seat-map` | Seat map management interface loads. | ☐ |

---

## 6. Journey D — Abdou (Super Admin / CEO): Revenue, Pricing, Compliance

**Tester Role:** `super_admin`  
**Objective:** Test executive dashboards, pricing configuration, and compliance  
**Estimated Time:** 25 minutes

---

### D1. Sales Dashboard

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D1.1 | Login as Abdou (super_admin) | — | Login succeeds. Admin dashboard accessible. | ☐ |
| D1.2 | Navigate to Sales Dashboard | `/admin/sales` | Sales intelligence dashboard loads with: revenue chart, KPI cards (daily/weekly/monthly revenue, ticket count, average fare), booking trend graphs, route performance table. | ☐ |
| D1.3 | Verify data presence | — | If bookings were made during UAT, they appear in the latest data. Revenue figures are non-zero. | ☐ |
| D1.4 | Check route performance | — | Table shows routes ranked by revenue, load factor, or booking count. Sorting works. | ☐ |

---

### D2. Dynamic Pricing Configuration

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D2.1 | Navigate to Pricing Rules | `/admin/pricing` | Pricing Rules Engine page loads with three sections: Time-to-Departure, Load Factor, Day-of-Week. | ☐ |
| D2.2 | Verify default multipliers | — | Time-to-departure: 30+ days = **0.85x**, 14–30d = **1.0x**, 7–14d = **1.15x**, 2–7d = **1.3x**, <48h = **1.5x**. Load factor: <30% = **0.85x**, 30–60% = **1.0x**, 60–80% = **1.2x**, >80% = **1.4x**. Day-of-week: Fri/Sun = **1.1x**, Sat = **0.9x**, weekdays = **1.0x**. | ☐ |
| D2.3 | Verify live preview | — | Bottom panel shows "$350 Economy Base Fare" example with adjusted fares per time bucket. Numbers update in real-time as multipliers change. | ☐ |
| D2.4 | Change a multiplier (e.g., <48h to **1.6x**) | — | Input accepts new value. Live preview updates immediately. Color indicators change (discount = green, surge = red). | ☐ |
| D2.5 | Click **Save Rules** | — | Success banner: "Pricing rules saved successfully." | ☐ |
| D2.6 | Refresh page | — | Saved multiplier persists (1.6x still showing for <48h). | ☐ |
| D2.7 | Click **Reset Defaults** | — | All multipliers revert to original defaults. | ☐ |
| D2.8 | Save defaults | — | Defaults saved. | ☐ |

---

### D3. User Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D3.1 | Navigate to User Management | `/admin/users` | User list table loads with columns: email, display name, role, status, last login. | ☐ |
| D3.2 | Search for test user | — | Search/filter narrows results. | ☐ |

---

### D4. Bookings Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D4.1 | Navigate to Bookings | `/admin/bookings` | All bookings table: PNR, passenger name, flight, status, amount, date. Searchable. | ☐ |
| D4.2 | Find booking from Journey A | — | Aisha's booking visible with correct PNR, status (confirmed or checked_in). | ☐ |

---

### D5. CMS Management

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D5.1 | Navigate to Page Editor | `/admin/cms/pages` | CMS page editor loads. | ☐ |
| D5.2 | Navigate to Header Management | `/admin/cms/header` | Header CMS loads with logo, navigation link fields. | ☐ |
| D5.3 | Navigate to Footer Management | `/admin/cms/footer` | Footer CMS loads. | ☐ |
| D5.4 | Navigate to Menu Management | `/admin/cms/menu` | Menu configuration page loads. | ☐ |
| D5.5 | Navigate to SEO / Favicon | `/admin/cms/seo` | SEO settings page loads. | ☐ |
| D5.6 | Navigate to About Values CMS | `/admin/cms/about-values` | About page content editor loads. | ☐ |

---

### D6. Security Settings

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D6.1 | Navigate to Session Monitor | `/admin/security/sessions` | Active sessions list renders. | ☐ |
| D6.2 | Navigate to Session Audit Log | `/admin/security/session-audit` | Session audit trail renders. | ☐ |
| D6.3 | Navigate to MFA Settings | `/admin/security/mfa` | MFA configuration page loads. | ☐ |
| D6.4 | Navigate to SSO Settings | `/admin/security/sso` | SSO configuration page loads. | ☐ |
| D6.5 | Navigate to Password Policy | `/admin/security/password-policy` | Password policy settings load. | ☐ |

---

### D7. Communications

| Step | Action | URL / Route | Expected Result | Pass |
|------|--------|-------------|-----------------|------|
| D7.1 | Navigate to Email Templates | `/admin/comms/email` | Email template editor loads with template list. | ☐ |
| D7.2 | Navigate to Email Audit Log | `/admin/comms/email-audit` | Email send history renders. | ☐ |
| D7.3 | Navigate to SMS Configuration | `/admin/comms/sms` | SMS settings page loads. | ☐ |
| D7.4 | Navigate to SMS Audit Log | `/admin/comms/sms-audit` | SMS log renders. | ☐ |

---

## 7. Journey E — Cross-Persona: End-to-End Lifecycle

**Objective:** Test the complete lifecycle spanning multiple personas  
**Tester Team:** 2 testers minimum (one as customer, one as ops)

---

### E1. Ops Publishes → Customer Books → Ops Monitors

| Step | Persona | Action | Expected Result | Pass |
|------|---------|--------|-----------------|------|
| E1.1 | Lamin | Create and publish a new schedule | Flights generated and available. | ☐ |
| E1.2 | Aisha | Search and find the newly published flight | Flight appears in search results. | ☐ |
| E1.3 | Aisha | Complete booking (full flow A2–A5) | PNR generated, booking confirmed. | ☐ |
| E1.4 | Lamin | View Sales Dashboard | New booking revenue reflected. | ☐ |
| E1.5 | Lamin | View Regulatory Manifest for that flight | Aisha's name appears in manifest. | ☐ |
| E1.6 | Lamin | Delay the flight by 1 hour | Flight status updates to "delayed". | ☐ |
| E1.7 | Aisha | Check flight status | Delayed status and new time shown. | ☐ |
| E1.8 | Aisha | Complete check-in (flow A7) | Boarding pass generated with updated time. | ☐ |
| E1.9 | Abdou | View audit log | Booking, delay, and check-in events all logged. | ☐ |

---

### E2. Pricing Impact Test

| Step | Persona | Action | Expected Result | Pass |
|------|---------|--------|-----------------|------|
| E2.1 | Abdou | Set <48h time multiplier to **1.5x** | Saved. | ☐ |
| E2.2 | Aisha | Search for flight departing within 48h | Displayed fare should be higher than base fare (≈ 1.5x if load is normal). | ☐ |
| E2.3 | Abdou | Reset pricing to defaults | Saved. | ☐ |

> [!NOTE]
> Dynamic pricing impact may require seed data with specific departure times and load factors to fully validate.

---

## 8. Accessibility & Responsiveness Checks

| # | Check | How to Verify | Pass |
|---|-------|---------------|------|
| 1 | Keyboard navigation | Tab through booking flow — all interactive elements focusable. | ☐ |
| 2 | Screen reader labels | Use accessibility inspector — form inputs have labels, buttons have accessible names. | ☐ |
| 3 | Mobile viewport (375px) | Resize browser to 375px width — all pages remain usable, no horizontal scroll. | ☐ |
| 4 | Tablet viewport (768px) | Resize to 768px — layout adjusts, no overlapping elements. | ☐ |
| 5 | Color contrast | Check body text against background — meets WCAG AA (4.5:1 ratio). | ☐ |

---

## 9. Performance Benchmarks

| # | Metric | Target | How to Measure | Pass |
|---|--------|--------|----------------|------|
| 1 | Homepage load | < 3 seconds | Browser DevTools → Performance → LCP | ☐ |
| 2 | Flight search response | < 2 seconds | Time from click "Search" to results rendered | ☐ |
| 3 | Seat map render | < 2 seconds | Time from navigation to seat map fully interactive | ☐ |
| 4 | Admin dashboard load | < 3 seconds | Time from login redirect to dashboard KPIs visible | ☐ |
| 5 | Manifest CSV export | < 5 seconds | Time from click "Export" to download starts | ☐ |

---

## 10. Sign-Off Sheet

| Journey | Tester Name | Date | Result | PO Sign-Off |
|---------|------------|------|--------|-------------|
| A — Aisha (Leisure) | | | ☐ Pass ☐ Fail | |
| B — Omar (Business) | | | ☐ Pass ☐ Fail | |
| C — Lamin (Operations) | | | ☐ Pass ☐ Fail | |
| D — Abdou (Super Admin) | | | ☐ Pass ☐ Fail | |
| E — Cross-Persona | | | ☐ Pass ☐ Fail | |
| Accessibility | | | ☐ Pass ☐ Fail | |
| Performance | | | ☐ Pass ☐ Fail | |

> [!IMPORTANT]
> **Release criteria:** All Journey Pass + no P0/P1 defects open. P2 defects may be deferred with PO approval.

---

## 11. Defect Logging Template

When logging defects during UAT, use this template:

```
**Defect ID:** UAT-[NNN]
**Journey / Step:** [e.g., A5.4]
**Persona:** [e.g., Aisha]
**Severity:** P0 (blocker) / P1 (critical) / P2 (major) / P3 (minor)
**Summary:** [one-line description]
**Steps to Reproduce:**
1. [step]
2. [step]
**Expected Result:** [what should happen]
**Actual Result:** [what actually happened]
**Screenshot:** [attach]
**Browser / Device:** [e.g., Chrome 120, Windows 11]
```
