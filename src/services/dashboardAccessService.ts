import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';

/* ── Types ─────────────────────────────────────────────────── */
export type DashboardAccessConfig = Record<string, string[]>;

/* ── Module registry — every admin sidebar item ──────────── */
export const MODULE_GROUPS = [
  {
    group: 'Core Operations',
    icon: 'hub',
    modules: [
      { id: 'DASHBOARD', label: 'Ops Dashboard', icon: 'dashboard' },
      { id: 'FLIGHT_SCHEDULING', label: 'Flight Operations', icon: 'schedule' },
      { id: 'MANAGE_DELAY', label: 'Delay Management', icon: 'timer_off' },
      { id: 'OPERATIONAL_TRIGGERS', label: 'Op Triggers', icon: 'bolt' },
      { id: 'ALERT_AUDIT_LOG', label: 'Alert Audit Log', icon: 'notification_important' },
      { id: 'MANIFEST_DOCS', label: 'Manifest & Docs', icon: 'description' },
    ],
  },
  {
    group: 'User Manager',
    icon: 'group',
    modules: [
      { id: 'BOOKINGS', label: 'Bookings', icon: 'confirmation_number' },
      { id: 'TICKET_REISSUE', label: 'Ticket Reissue', icon: 'receipt_long' },
      { id: 'USER_MANAGEMENT', label: 'User Management', icon: 'manage_accounts' },
      { id: 'BOARDING_SCANNER', label: 'Boarding Scanner', icon: 'qr_code_scanner' },
      { id: 'ACCOUNT_SETTINGS', label: 'Account Settings', icon: 'settings' },
      { id: 'NOTIFICATION_PREFERENCES', label: 'Notifications', icon: 'notifications' },
    ],
  },
  {
    group: 'Content CMS',
    icon: 'edit_note',
    modules: [
      { id: 'PAGE_EDITOR', label: 'Page Builder', icon: 'web' },
      { id: 'FAVICON_SEO', label: 'SEO & Branding', icon: 'search' },
    ],
  },
  {
    group: 'Security',
    icon: 'shield',
    modules: [
      { id: 'SESSION_MONITOR', label: 'Session Monitor', icon: 'monitor_heart' },
      { id: 'SESSION_AUDIT_LOG', label: 'Session Audit Log', icon: 'history' },
      { id: 'MFA_SETTINGS', label: 'MFA Settings', icon: 'security' },
      { id: 'SSO_SETTINGS', label: 'SSO Settings', icon: 'key' },
      { id: 'PASSWORD_POLICY', label: 'Password Policy', icon: 'lock' },
      { id: 'SECURITY_KEYS', label: 'Security Keys', icon: 'security_key' },
    ],
  },
  {
    group: 'Communications',
    icon: 'mail',
    modules: [
      { id: 'EMAIL_TEMPLATES', label: 'Email Templates', icon: 'drafts' },
      { id: 'EMAIL_AUDIT_LOG', label: 'Email Audit Log', icon: 'mark_email_read' },
      { id: 'SMS_CONFIGURATION', label: 'SMS Config', icon: 'sms' },
      { id: 'SMS_AUDIT_LOG', label: 'SMS Audit Log', icon: 'chat_bubble' },
    ],
  },
  {
    group: 'Experiments',
    icon: 'science',
    modules: [
      { id: 'EXPERIMENTS_DASHBOARD', label: 'Experiments', icon: 'labs' },
      { id: 'EXPERIMENTS_AUDIT_LOG', label: 'Experiment Audit', icon: 'biotech' },
    ],
  },
  {
    group: 'Revenue',
    icon: 'payments',
    modules: [
      { id: 'SALES_DASHBOARD', label: 'Sales Dashboard', icon: 'trending_up' },
      { id: 'PRICING_RULES', label: 'Pricing Rules', icon: 'price_change' },
      { id: 'LOYALTY_ADMIN', label: 'Loyalty Admin', icon: 'loyalty' },
      { id: 'ANCILLARY_ADMIN', label: 'Ancillary Products', icon: 'shopping_bag' },
    ],
  },
  {
    group: 'Crew',
    icon: 'badge',
    modules: [
      { id: 'CREW_MANAGEMENT', label: 'Crew Management', icon: 'group' },
      { id: 'CREW_SCHEDULING', label: 'Crew Scheduling', icon: 'calendar_month' },
      { id: 'CREW_FRMS_REPORT', label: 'FRMS Report', icon: 'summarize' },
    ],
  },
] as const;

/** All module IDs, flattened */
export const ALL_MODULE_IDS = MODULE_GROUPS.flatMap(g => g.modules.map(m => m.id));

/* ── Default access per role (used when no Firestore doc exists) */
const DEFAULT_ACCESS: DashboardAccessConfig = {
  ops_manager: [...ALL_MODULE_IDS], // full access by default
  crew_sched: ['DASHBOARD', 'FLIGHT_SCHEDULING', 'CREW_MANAGEMENT', 'CREW_SCHEDULING', 'FLEET_MANAGEMENT', 'ACCOUNT_SETTINGS'],
  cs_agent: ['DASHBOARD', 'BOOKINGS', 'TICKET_REISSUE', 'USER_MANAGEMENT', 'ACCOUNT_SETTINGS', 'NOTIFICATION_PREFERENCES'],
};

const DOC_REF = doc(db, 'appConfig', 'dashboardAccess');

/* ── Read ───────────────────────────────────────────────────── */
export async function getDashboardAccess(): Promise<DashboardAccessConfig> {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      return snap.data() as DashboardAccessConfig;
    }
    return { ...DEFAULT_ACCESS };
  } catch (err) {
    console.error('[dashboardAccessService] Read error:', err);
    return { ...DEFAULT_ACCESS };
  }
}

/* ── Write ──────────────────────────────────────────────────── */
export async function saveDashboardAccess(config: DashboardAccessConfig): Promise<void> {
  await setDoc(DOC_REF, config, { merge: false });
}
