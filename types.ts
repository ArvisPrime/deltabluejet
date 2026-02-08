
export enum Page {
  DASHBOARD = 'DASHBOARD',
  BOOKINGS = 'BOOKINGS',
  REISSUE = 'REISSUE',
  FLEET = 'FLEET',
  MANIFEST = 'MANIFEST',
  SEAT_MAP = 'SEAT_MAP',
  USER_MGMT = 'USER_MGMT',
  // Internal Ops Pages
  SCHEDULING = 'SCHEDULING',
  GATE_CONTROL = 'GATE_CONTROL',
  MANAGE_DELAY = 'MANAGE_DELAY',
  DISRUPTION_RESOLUTION = 'DISRUPTION_RESOLUTION',
  REGULATORY_MANIFEST = 'REGULATORY_MANIFEST',
  SEAT_MAP_CMS = 'SEAT_MAP_CMS',
  AIRCRAFT_SWAP = 'AIRCRAFT_SWAP',
  OPERATIONAL_TRIGGERS = 'OPERATIONAL_TRIGGERS',
  ALERT_AUDIT_LOG = 'ALERT_AUDIT_LOG',
  // Communication Pages
  EMAIL_CMS = 'EMAIL_CMS',
  EMAIL_AUDIT_LOG = 'EMAIL_AUDIT_LOG',
  SMS_CMS = 'SMS_CMS',
  SMS_AUDIT_LOG = 'SMS_AUDIT_LOG',
  // Security Pages
  MFA_CONFIG = 'MFA_CONFIG',
  SSO_CONFIG = 'SSO_CONFIG',
  PASSWORD_POLICY = 'PASSWORD_POLICY',
  SESSION_MONITOR = 'SESSION_MONITOR',
  SESSION_AUDIT_LOG = 'SESSION_AUDIT_LOG',
  // Booking Flow Pages (Assisted)
  BOOKING_SEARCH = 'BOOKING_SEARCH',
  BOOKING_RESULTS = 'BOOKING_RESULTS',
  BOOKING_FARE = 'BOOKING_FARE',
  BOOKING_PASSENGERS = 'BOOKING_PASSENGERS',
  BOOKING_SEATS = 'BOOKING_SEATS',
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  // Check-in Flow Pages
  CHECKIN_RETRIEVAL = 'CHECKIN_RETRIEVAL',
  CHECKIN_PASSENGERS = 'CHECKIN_PASSENGERS',
  CHECKIN_DECLARATION = 'CHECKIN_DECLARATION',
  CHECKIN_SEATS = 'CHECKIN_SEATS',
  CHECKIN_SUCCESS = 'CHECKIN_SUCCESS',
  // Management Flow
  MANAGE_BOOKING_RETRIEVAL = 'MANAGE_BOOKING_RETRIEVAL',
  // Flight Tracker Flow
  FLIGHT_TRACKER_SEARCH = 'FLIGHT_TRACKER_SEARCH',
  FLIGHT_TRACKER_RESULTS = 'FLIGHT_TRACKER_RESULTS',
  // Destinations Hub
  DESTINATIONS = 'DESTINATIONS',
  DESTINATION_DETAIL = 'DESTINATION_DETAIL',
  // User-Centric Management Pages
  BOOKING_DETAIL = 'BOOKING_DETAIL',
  MODIFY_BOOKING = 'MODIFY_BOOKING',
  NOTIFICATION_PREFS = 'NOTIFICATION_PREFS',
  ACCOUNT_SETTINGS = 'ACCOUNT_SETTINGS',
  // Change Workflow & CMS
  REVIEW_FLIGHT_CHANGE = 'REVIEW_FLIGHT_CHANGE',
  FLIGHT_CHANGE_SUCCESS = 'FLIGHT_CHANGE_SUCCESS',
  MENU_MGMT = 'MENU_MGMT',
  HEADER_MGMT = 'HEADER_MGMT',
  PAGE_EDITOR = 'PAGE_EDITOR',
  FOOTER_MGMT = 'FOOTER_MGMT',
  // Optimization & Testing
  EXPERIMENTS_DASHBOARD = 'EXPERIMENTS_DASHBOARD',
  EXPERIMENTS_AUDIT_LOG = 'EXPERIMENTS_AUDIT_LOG',
  // Branding & SEO
  FAVICON_SEO_LOG = 'FAVICON_SEO_LOG',
  // Landing Page
  HOME_LANDING = 'HOME_LANDING'
}

export interface Flight {
  id: string;
  number: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  status: 'On Time' | 'Delayed' | 'Cancelled' | 'Scheduled';
  aircraft: string;
  seatsOccupied: number;
  totalSeats: number;
}

export interface Booking {
  id: string;
  customer: string;
  email: string;
  service: string;
  date: string;
  amount: string;
  status: 'Confirmed' | 'Pending' | 'Canceled' | 'Paid' | 'Refunded';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Manager' | 'Customer' | 'Ops Manager' | 'System Admin' | 'Crew Sched.';
  status: 'Active' | 'Pending' | 'Inactive' | 'Suspended';
  lastLogin: string;
  avatar: string;
  alertLevel: string;
}

export interface DestinationHub {
  city: string;
  country: string;
  airport: string;
  frequency: string;
  equipment: string;
  profile: string;
  img: string;
  detail?: string;
}
