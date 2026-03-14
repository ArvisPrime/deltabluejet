# DeltaBlue Jet Air — Full Error Audit Report

**Date:** February 21, 2026  
**Scope:** Complete front-end to back-end review  
**Build Status:** ✅ Pass (exit 0, 5.69s)  
**TypeScript Strict Check:** ✅ Pass (0 errors, `strict: true`)  
**Deployment:** ❌ **NOT deployed** — report only, pending your approval

---

## Executive Summary

The application **compiles and builds cleanly** — there are zero TypeScript or Vite build errors. However, this audit uncovered **17 distinct issues** across 5 categories. Most are **runtime or architectural issues** that won't surface until the app tries to read/write data or handle edge cases.

| Category | Critical | High | Medium | Low | Total |
|----------|:--------:|:----:|:------:|:---:|:-----:|
| 🔴 Firestore Rules ↔ Code Mismatch | 3 | — | — | — | 3 |
| 🟠 Security & Auth | — | 2 | 1 | — | 3 |
| 🟡 Service & Runtime | — | 2 | 2 | — | 4 |
| 🔵 Configuration & Environment | — | 1 | 1 | 1 | 3 |
| ⚪ Architecture & UX | — | — | 2 | 2 | 4 |
| **Total** | **3** | **5** | **6** | **3** | **17** |

---

## 🔴 CRITICAL — Firestore Collection Name Mismatches

These will cause **immediate permission-denied errors** in production. The code writes to collection names that don't match the Firestore security rules.

### Issue #1: CMS Pages — `cmsPages` vs `cms_pages`

| Layer | Collection Name |
|-------|----------------|
| **Code** (`cms.ts` line 31) | `cmsPages` |
| **Firestore Rules** (line 101) | `cms_pages` |

**Impact:** All CMS page reads/writes will be **denied** because Firestore rules only protect `cms_pages` — the `cmsPages` collection is completely unprotected (no matching rule = default deny).

---

### Issue #2: Email Templates — `emailTemplates` vs `email_templates`

| Layer | Collection Name |
|-------|----------------|
| **Code** (`notifications.ts` line 32, `notificationDispatcher.ts` line 27) | `emailTemplates` |
| **Firestore Rules** (line 107) | `email_templates` |

**Impact:** Same as above — all email template operations silently fail or are denied.

---

### Issue #3: SMS Templates — `smsTemplates` vs `sms_templates`

| Layer | Collection Name |
|-------|----------------|
| **Code** (`notifications.ts` line 33, `notificationDispatcher.ts` line 28) | `smsTemplates` |
| **Firestore Rules** (line 113) | `sms_templates` |

**Impact:** Same as above — all SMS template operations silently fail or are denied.

---

### Root Cause
The code uses **camelCase** collection names while Firestore rules use **snake_case**. One naming convention must be chosen. Since Firestore collection names are case-sensitive, these are entirely different collections.

### Fix Options
- **Option A:** Rename collections in code to match rules (`cms_pages`, `email_templates`, `sms_templates`)
- **Option B:** Rename rules to match code (`cmsPages`, `emailTemplates`, `smsTemplates`)

> [!CAUTION]
> If any data already exists in production under either naming convention, the rename must match whichever convention already has data.

---

## 🟠 HIGH — Security & Auth Issues

### Issue #4: Missing Firestore Rules for 3 Collections

The following collections are referenced in code but have **no matching Firestore security rules**, meaning they fall through to the default deny-all:

| Collection (in code) | Service File | Rule Exists? |
|----------------------|-------------|:------------:|
| `notificationLogs` | `notifications.ts` line 34, `notificationDispatcher.ts` | ❌ No |
| `cmsConfig` | `cms.ts` line 32 | ❌ No |
| `schedules` (when implemented) | Referenced in `types/firestore.ts` | ❌ No |

**Impact:** Any read/write to these collections will be **denied** in production (or wide-open if using test rules).

---

### Issue #5: Payments Collection — Frontend Writes Blocked by Rules

| Detail | Value |
|--------|-------|
| **Code:** `paymentService.ts` line 26 | Writes to `payments` collection from frontend |
| **Rule:** `firestore.rules` line 77 | `allow write: if false;` — "Only Cloud Functions can write" |

**Impact:** The `paymentService.ts` creates payment documents directly from the client, but the rules explicitly block **all** client writes. In dev mode (simulated payments) this will silently fail. This is actually a correctly restrictive rule for production, but the current frontend simulated payment flow breaks against it.

**Fix:** Either relax rules in dev mode, or move payment creation to a Cloud Function (recommended for production).

---

### Issue #6: Aircraft Collection — Public Read Access

| Detail | Value |
|--------|-------|
| **Rule:** `firestore.rules` line 44 | `allow read: if true;` — Anyone can read aircraft data |

**Assessment:** Low-risk for now, but aircraft details (registration numbers, maintenance schedules, weight limits) are **operational data** that should not be publicly accessible. Consider restricting to authenticated users.

---

## 🟡 HIGH — Service & Runtime Issues

### Issue #7: `gemini.ts` — API Key Exposure Risk

```javascript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

While this is shimmed via `vite.config.ts` (`define: { 'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY) }`), the API key is **baked into the client-side JavaScript bundle** at build time. Anyone can extract it from browser DevTools.

**Impact:** The Gemini API key is visible in the production bundle. This could lead to unauthorized API usage and billing charges.

**Fix:** Move the Gemini call to a Cloud Function so the API key stays server-side.

---

### Issue #8: `gemini.ts` — Model Name May Be Invalid

```javascript
model: 'gemini-3-flash-preview',
```

The model name `gemini-3-flash-preview` may not exist or may be deprecated by the time of deployment. The Gemini SDK will throw a runtime error if the model is not available.

---

### Issue #9: `eTicketSeq` — Non-Persistent Counter

In `paymentService.ts` line 31:
```javascript
let eTicketSeq = 0;
```

This in-memory counter resets on every page refresh, meaning:
- e-Ticket numbers are **not unique** across sessions
- Format `DBJ-20260221-001` will reset to `001` after every reload

**Fix:** Use Firestore's `increment()` or a dedicated counter document.

---

### Issue #10: `checkForUpcomingDepartures()` — Compound Query Requires Index

In `notificationTriggers.ts` line 117-120:
```javascript
where('status', '==', 'scheduled'),
where('departureTime', '>=', Timestamp.fromDate(now)),
where('departureTime', '<=', Timestamp.fromDate(in24h)),
```

This compound query with equality on `status` and range on `departureTime` requires a **composite Firestore index**. Without it, the query will throw a runtime error with a link to create the index.

**Fix:** Add composite index to `firestore.indexes.json` or create via Firebase Console when the error appears.

---

## 🔵 MEDIUM — Configuration & Environment

### Issue #11: No `.env` File Present

The Firebase config (`firebase.config.ts`) reads 7 environment variables:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

But **no `.env` file exists** in the project root. The app will initialize Firebase with `undefined` for all values, causing:
- Auth operations to fail silently
- Firestore reads to return empty results
- All service calls to throw "Invalid Firebase configuration" errors

**Impact:** 🟡 If the app currently works, the env vars must be set somewhere else (system env, CI/CD). But there should be a `.env.example` file documenting required variables.

---

### Issue #12: Vite Config — `loadEnv` Source Path

In `vite.config.ts` line 6:
```javascript
const env = loadEnv(mode, '.', '');
```

The second argument `'.'` loads env from the **current working directory** rather than the project root. If the build process runs from a different directory, env vars won't be loaded.

**Impact:** Low — works correctly when running `npm run dev` from project root, but fragile for CI/CD.

---

### Issue #13: Build Warning — Large Chunk Size

The build produces a warning about chunk size exceeding the limit for the Destinations module (~220 kB gzipped). This affects initial load performance.

**Fix:** Consider code-splitting the destination hub data or lazy-loading large data files.

---

## ⚪ MEDIUM/LOW — Architecture & UX

### Issue #14: No React Error Boundary

There is **no** `ErrorBoundary` component anywhere in the app. If any component throws a runtime error (e.g., Firestore network failure, undefined property access), the **entire app crashes** to a white screen with no recovery path.

**Impact:** Critical for production UX — any runtime error is catastrophic.

**Fix:** Add a top-level `ErrorBoundary` component wrapping `RouterProvider` in `App.tsx`.

---

### Issue #15: 46 Silent `console.error` Catch Blocks

Found **46 instances** of `catch(err) { console.error(...) }` across the codebase. These:
- Silently swallow errors without showing feedback to the user
- Log to console (invisible to users)
- Don't trigger any recovery (retry, fallback, or error state)

**Affected areas:** CMS, email templates, SMS, fleet management, bookings, payments, dashboard, about page, and more.

**Fix:** Replace silent catches with toast notifications and/or error state management.

---

### Issue #16: No 404 / Catch-All Route

The router has no `*` catch-all route. Navigating to an undefined URL (e.g., `/admin/nonexistent`) renders a blank page inside the layout.

**Fix:** Add a `{ path: '*', element: <NotFound /> }` route.

---

### Issue #17: Cloud Functions — `functions/index.js` Not TypeScript

The Cloud Functions entry point (`functions/index.js`, 26 KB) is plain JavaScript while the rest of the project is TypeScript. This creates an inconsistency and bypasses type checking for critical backend logic.

---

## Summary of Recommended Fixes by Priority

### Do Immediately (Before Any Deployment)

| # | Fix | Effort |
|---|-----|--------|
| 1–3 | Align collection names between code and Firestore rules | 30 min |
| 4 | Add missing Firestore rules for `notificationLogs`, `cmsConfig` | 15 min |
| 11 | Create `.env.example` documenting all required env vars | 10 min |
| 14 | Add React ErrorBoundary component | 30 min |

### Do Soon (Before User Testing)

| # | Fix | Effort |
|---|-----|--------|
| 5 | Move payment creation to Cloud Function or add dev-mode rule | 2 hrs |
| 7 | Move Gemini API call to Cloud Function | 1 hr |
| 9 | Replace in-memory eTicket counter with Firestore counter | 30 min |
| 15 | Replace silent catches with toast notifications | 2 hrs |
| 16 | Add 404 catch-all route | 15 min |

### Plan For (Technical Debt)

| # | Fix | Effort |
|---|-----|--------|
| 6 | Restrict aircraft reads to authenticated users | 10 min |
| 8 | Verify Gemini model name against current API | 5 min |
| 10 | Create composite Firestore indexes | 15 min |
| 12 | Fix `loadEnv` source path | 5 min |
| 13 | Code-split destination data | 1 hr |
| 17 | Convert Cloud Functions to TypeScript | 4 hrs |

---

> [!IMPORTANT]
> **No changes have been deployed.** This document is a report only. All fixes require your approval before implementation.
