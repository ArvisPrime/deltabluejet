# DeltaBlue Jet Air — SDLC Personas & RACI Matrix

**Version:** 1.0 — February 2026  
**Companion to:** [PRD](./prd.md) · [Service Design](./service_design.md) · [System Architecture](./system_architecture.md) · [Strategic Roadmap](./strategic_roadmap.md)

---

## 1. Purpose

This document defines the **people** involved in the Software Development Life Cycle of DeltaBlue Jet Air — from ideation through deployment and post-launch monitoring. Each persona maps to a real role needed to execute the roadmap defined in [strategic_roadmap.md](./strategic_roadmap.md).

> [!NOTE]
> The *end-user* personas (Aisha, Omar, Mariama, Lamin, Abdou) are documented in [service_design.md](./service_design.md). This document covers the **builder-side** personas — the people who design, develop, ship, and maintain the system.

---

## 2. SDLC Persona Directory

### 2.1 Product Owner — Fatou Ceesay

| Attribute | Detail |
|-----------|--------|
| **Role** | Product Owner / Business Analyst |
| **SDLC Phase** | Requirements, Planning, UAT, Release |
| **Core Responsibility** | Owns the product backlog, prioritises features, defines acceptance criteria, and validates that shipped work matches the PRD. |
| **Key Decisions** | Feature scope, priority ranking (P0–P2), go/no-go for release |
| **Tools** | Linear/Jira (backlog), Figma (design review), Firebase Console (data validation) |
| **Interacts With** | CEO (Abdou), Ops Manager (Lamin), Engineering Lead, QA |
| **Success Metric** | Sprint velocity, stakeholder satisfaction, PRD coverage % |

> **Fatou says:** *"If it's not in the acceptance criteria, it's not done."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Requirements** | Translates business needs from Abdou and Lamin into user stories with acceptance criteria |
| **Planning** | Prioritises sprint backlog, resolves scope conflicts, defines MVP vs stretch goals |
| **Development** | Available for clarification, reviews in-progress work against PRD modules |
| **UAT** | Executes acceptance tests, signs off on features before release |
| **Release** | Coordinates release timing with ops team, drafts release notes |

---

### 2.2 Engineering Lead — Modou Joof

| Attribute | Detail |
|-----------|--------|
| **Role** | Technical Lead / Senior Full-Stack Engineer |
| **SDLC Phase** | Architecture, Development, Code Review, Deployment |
| **Core Responsibility** | Translates product requirements into technical architecture, defines coding standards, leads implementation of core modules, and owns deployment pipeline. |
| **Key Decisions** | Architecture patterns, tech stack choices, Firestore schema design, API contracts |
| **Tools** | VS Code, Firebase CLI, GitHub, Vite, React DevTools |
| **Interacts With** | Product Owner (Fatou), Frontend Engineers, Cloud Functions Dev, QA |
| **Success Metric** | System uptime (> 99.9%), build success rate, code review turnaround |

> **Modou says:** *"Every Firestore transaction should be idempotent. If it can fail, it will fail — in production, on a Friday."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Architecture** | Designs data models (see [system_architecture.md § 3](./system_architecture.md)), defines API contracts, selects patterns (event-driven, transactional) |
| **Development** | Implements critical-path modules (Inventory Pipeline, Payment Processing), pair-programs on complex features |
| **Code Review** | Reviews all PRs for correctness, performance, and security — enforces no-double-booking invariants |
| **Deployment** | Manages Firebase deploy (`firebase deploy`), Cloud Function versioning, rollback procedures |
| **Monitoring** | Watches Firebase Performance, Firestore read/write quotas, error rates post-deploy |

---

### 2.3 Frontend Engineer — Isatou Manneh

| Attribute | Detail |
|-----------|--------|
| **Role** | Frontend Developer (React / TypeScript) |
| **SDLC Phase** | Design Review, Development, Integration Testing |
| **Core Responsibility** | Builds and maintains the React SPA — the 60+ page admin dashboard, booking flow, check-in experience, and public website. |
| **Key Decisions** | Component architecture, Zustand store design, responsive breakpoints, animation patterns |
| **Tools** | VS Code, React DevTools, Vite HMR, Tailwind CSS, Figma for specs |
| **Interacts With** | Engineering Lead (Modou), UX Designer (Mariama B.), QA |
| **Success Metric** | Lighthouse score > 90, flight search < 500ms, zero broken booking flows |

> **Isatou says:** *"The admin dashboard has 30 pages. If I can't reuse a hook across all of them, the abstraction is wrong."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Design Review** | Reviews Figma mockups, flags technical constraints, estimates component complexity |
| **Development** | Implements React components, wires Zustand stores, integrates Cloud Function APIs |
| **Integration** | Connects frontend to Firestore real-time listeners, tests seat conflict prevention, validates payment flow |
| **Accessibility** | Ensures WCAG 2.1 AA compliance on booking flow, proper ARIA labels, keyboard navigation |

---

### 2.4 Backend / Cloud Functions Engineer — Ebrima Saidy

| Attribute | Detail |
|-----------|--------|
| **Role** | Backend Developer (Node.js / Firebase) |
| **SDLC Phase** | Architecture, Development, Integration, Deployment |
| **Core Responsibility** | Designs and implements the serverless backend — Cloud Functions, Firestore security rules, Stripe integration, and Pub/Sub event handlers. |
| **Key Decisions** | Cloud Function structure, Firestore indexing strategy, webhook security, transaction boundaries |
| **Tools** | Firebase CLI, Firebase Emulator Suite, Stripe Dashboard, GCP Console, Postman |
| **Interacts With** | Engineering Lead (Modou), Frontend Engineer (Isatou), DevOps |
| **Success Metric** | Payment success rate > 95%, Cloud Function cold start < 2s, zero inventory inconsistencies |

> **Ebrima says:** *"If the Stripe webhook fails, the customer thinks they paid but we never confirmed the booking. That's the worst bug possible."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Architecture** | Designs Cloud Function callable/HTTP split, defines Pub/Sub event schema, plans Firestore security rules |
| **Development** | Implements `publishSchedule`, `createPaymentIntent`, `handleStripeWebhook` (see [system_architecture.md § 4](./system_architecture.md)) |
| **Security** | Writes and tests Firestore security rules, implements role-based access (super_admin, ops_manager, customer) |
| **Integration** | Tests full flow: booking → payment → confirmation → notification via Firebase Emulator Suite |

---

### 2.5 UX / UI Designer — Mariama Bah

| Attribute | Detail |
|-----------|--------|
| **Role** | Product Designer / UX Researcher |
| **SDLC Phase** | Discovery, Design, Usability Testing, Iteration |
| **Core Responsibility** | Designs user interfaces and interactions for both customer-facing and admin experiences. Conducts user research to validate design decisions. |
| **Key Decisions** | UI layout, interaction patterns, information hierarchy, brand expression in-product |
| **Tools** | Figma, Maze (usability testing), Hotjar (analytics), Principle (prototyping) |
| **Interacts With** | Product Owner (Fatou), Frontend Engineer (Isatou), End-Users (Aisha, Omar, Lamin) |
| **Success Metric** | Task completion rate > 85% on usability tests, SUS score > 80, booking flow < 4min avg |

> **Mariama B. says:** *"Aisha books on her phone in a taxi. If the seat map doesn't load in 3 seconds, she'll give up."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Discovery** | Interviews end-user personas, maps emotional journeys (see [service_design.md § 5](./service_design.md)), identifies pain points |
| **Design** | Creates wireframes → high-fidelity mockups → interactive prototypes for booking, check-in, and admin flows |
| **Handoff** | Annotates Figma files with spacing, colors, states; aligns with Tailwind design tokens |
| **Usability Testing** | Runs moderated tests with Aisha-type and Omar-type users, documents findings, prioritises fixes |
| **Iteration** | Updates designs based on test results and post-launch analytics |

---

### 2.6 QA / Test Engineer — Amadou Drammeh

| Attribute | Detail |
|-----------|--------|
| **Role** | Quality Assurance Engineer |
| **SDLC Phase** | Test Planning, Execution, Regression, Release Certification |
| **Core Responsibility** | Ensures every shipped feature works correctly across all user personas and edge cases. Owns the test strategy, regression suite, and release sign-off. |
| **Key Decisions** | Test coverage requirements, regression scope, bug severity classification, release readiness |
| **Tools** | Playwright (E2E), Vitest (unit), Firebase Emulator, Stripe Test Mode, BrowserStack |
| **Interacts With** | Product Owner (Fatou), Engineering Lead (Modou), Frontend/Backend Engineers |
| **Success Metric** | Bug escape rate < 2%, critical bugs: 0 in production, test coverage > 80% |

> **Amadou says:** *"I don't test if the button works. I test what happens when two people click it at the same time."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **Test Planning** | Writes test cases from acceptance criteria, maps test scenarios to PRD requirements |
| **Manual Testing** | Executes exploratory testing across booking flow, check-in, admin dashboard, payment |
| **Automated Testing** | Builds and maintains Playwright E2E suite for critical paths: search → book → pay → confirm |
| **Regression** | Runs full regression before each release, validates no existing features broken |
| **Performance** | Load tests flight search (<500ms), seat map (<300ms), payment (<3s) — per [prd.md § 4](./prd.md) |

---

### 2.7 DevOps / Infrastructure — Saikou Jallow

| Attribute | Detail |
|-----------|--------|
| **Role** | DevOps Engineer / Site Reliability |
| **SDLC Phase** | CI/CD, Deployment, Monitoring, Incident Response |
| **Core Responsibility** | Owns the deployment pipeline, infrastructure configuration, monitoring, and incident response. Ensures 99.9% uptime target. |
| **Key Decisions** | CI/CD pipeline design, Firebase project structure (dev/staging/prod), alerting thresholds, rollback triggers |
| **Tools** | GitHub Actions, Firebase CLI, GCP Cloud Monitoring, PagerDuty, Terraform (future) |
| **Interacts With** | Engineering Lead (Modou), Backend Engineer (Ebrima), QA (Amadou) |
| **Success Metric** | Deploy frequency > 2×/week, MTTR < 30min, zero unplanned outages per quarter |

> **Saikou says:** *"If we can't roll back a deploy in 60 seconds, we shouldn't have deployed."*

**Key Activities by SDLC Phase:**
| Phase | Activities |
|-------|-----------|
| **CI/CD** | Configures GitHub Actions: lint → type-check → test → build → deploy to Firebase Hosting + Cloud Functions |
| **Environment Management** | Maintains dev / staging / production Firebase projects with isolated Firestore instances |
| **Monitoring** | Sets up CloudMonitoring dashboards for Cloud Function latency, error rates, Firestore quota usage |
| **Incident Response** | On-call rotation, runbooks for common failures (payment webhook timeout, Firestore quota exceeded) |
| **Security Ops** | Manages Firebase security rules deployment, Stripe webhook secret rotation, SSL certificates |

---

## 3. RACI Matrix

> **R** = Responsible (does the work) · **A** = Accountable (owns the outcome) · **C** = Consulted · **I** = Informed

| Activity | Fatou (PO) | Modou (Lead) | Isatou (FE) | Ebrima (BE) | Mariama B. (UX) | Amadou (QA) | Saikou (DevOps) |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Requirements gathering** | A/R | C | I | I | C | I | — |
| **Architecture design** | C | A/R | C | R | — | C | C |
| **UI/UX design** | C | C | C | — | A/R | — | — |
| **Sprint planning** | A/R | R | C | C | C | C | I |
| **Frontend development** | I | C | A/R | — | C | I | — |
| **Backend development** | I | C | — | A/R | — | I | — |
| **Code review** | — | A/R | R | R | — | — | — |
| **Test planning** | C | C | I | I | — | A/R | — |
| **Manual QA** | I | I | C | C | — | A/R | — |
| **Automated testing** | — | C | R | R | — | A/R | C |
| **CI/CD pipeline** | I | C | — | — | — | C | A/R |
| **Deployment** | I | A | — | R | — | C | R |
| **Monitoring & alerts** | I | C | — | — | — | — | A/R |
| **Incident response** | I | R | C | C | — | — | A/R |
| **Release sign-off** | A/R | R | — | — | — | R | R |
| **Stakeholder comms** | A/R | C | — | — | — | — | — |

---

## 4. Communication Cadences

| Ceremony | Frequency | Participants | Purpose |
|----------|-----------|-------------|---------|
| **Daily Standup** | Daily, 15 min | All 7 personas | Blockers, progress, alignment |
| **Sprint Planning** | Bi-weekly | Fatou, Modou, Isatou, Ebrima, Amadou | Scope next sprint from backlog |
| **Design Review** | Weekly | Fatou, Isatou, Mariama B. | Review upcoming UI before dev |
| **Code Review** | Per PR | Modou + author | Quality gate before merge |
| **Demo & Retro** | Bi-weekly | All + Abdou (CEO) | Showcase shipped work, process improvement |
| **Release Review** | Per release | Fatou, Modou, Amadou, Saikou | Go/no-go decision |
| **Incident Post-Mortem** | Per P0/P1 incident | Modou, Ebrima, Saikou | Root cause analysis, prevention |

---

## 5. Persona ↔ Roadmap Phase Mapping

| Persona | Phase 1 (Foundation) | Phase 2 (Revenue Engine) | Phase 3 (Scale) | Phase 4 (Growth) |
|---------|:-:|:-:|:-:|:-:|
| **Fatou** (PO) | ● Heavy | ● Heavy | ● | ● |
| **Modou** (Lead) | ● Heavy | ● | ● Heavy | ● |
| **Isatou** (FE) | ● | ● Heavy | ● | ● Heavy |
| **Ebrima** (BE) | ● Heavy | ● | ● Heavy | ● |
| **Mariama B.** (UX) | ○ | ● Heavy | ● | ● Heavy |
| **Amadou** (QA) | ● | ● | ● | ● Heavy |
| **Saikou** (DevOps) | ○ | ○ | ● | ● Heavy |

**Legend:** ● = Active contributor · ● Heavy = Primary workload · ○ = On-call / advisory
