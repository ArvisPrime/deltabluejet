/**
 * Travel Document Validation Service — Deltablue Jet Air
 *
 * Validates passport expiry dates (6-month rule), document format,
 * and provides visa requirement lookups.
 */

// ─── Passport Expiry Validation ────────────────────────────

export interface ExpiryValidation {
    valid: boolean;
    message: string;
    severity: 'ok' | 'warning' | 'error';
    monthsRemaining: number;
}

/**
 * Check if a passport satisfies the 6-month validity rule.
 * Most countries require passports to be valid for at least 6 months
 * beyond the intended stay.
 */
export function validatePassportExpiry(
    expiryDateStr: string,
    travelDateStr: string,
): ExpiryValidation {
    const expiry = new Date(expiryDateStr);
    const travel = new Date(travelDateStr);
    const now = new Date();

    if (isNaN(expiry.getTime())) {
        return { valid: false, message: 'Invalid expiry date', severity: 'error', monthsRemaining: 0 };
    }

    // Already expired
    if (expiry < now) {
        return { valid: false, message: 'Passport has expired', severity: 'error', monthsRemaining: 0 };
    }

    const msInMonth = 30.44 * 24 * 60 * 60 * 1000;
    const monthsFromTravel = (expiry.getTime() - travel.getTime()) / msInMonth;
    const monthsFromNow = (expiry.getTime() - now.getTime()) / msInMonth;
    const monthsRemaining = Math.floor(monthsFromNow);

    if (monthsFromTravel < 6) {
        return {
            valid: false,
            message: `Passport expires ${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''} from now — most countries require at least 6 months validity beyond travel date`,
            severity: 'error',
            monthsRemaining,
        };
    }

    if (monthsFromTravel < 9) {
        return {
            valid: true,
            message: `Passport valid but expires in ${monthsRemaining} months — consider renewing soon`,
            severity: 'warning',
            monthsRemaining,
        };
    }

    return {
        valid: true,
        message: 'Passport validity is sufficient',
        severity: 'ok',
        monthsRemaining,
    };
}

// ─── Document Format Validation ────────────────────────────

export interface FormatValidation {
    valid: boolean;
    message: string;
}

/**
 * Basic passport number format validation.
 * Passports are typically 6–9 alphanumeric characters.
 */
export function validateDocumentFormat(docNumber: string, _nationality?: string): FormatValidation {
    const trimmed = docNumber.trim().toUpperCase();

    if (!trimmed) {
        return { valid: false, message: 'Document number is required' };
    }

    if (trimmed.length < 5 || trimmed.length > 12) {
        return { valid: false, message: 'Document number should be 5–12 characters' };
    }

    if (!/^[A-Z0-9]+$/i.test(trimmed)) {
        return { valid: false, message: 'Document number should contain only letters and numbers' };
    }

    return { valid: true, message: '' };
}

// ─── Name Matching ─────────────────────────────────────────

export function normalizeDocName(name: string): string {
    return name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z\s]/g, '')
        .replace(/\s+/g, ' ');
}

export function namesMatch(bookingName: string, docName: string): boolean {
    const a = normalizeDocName(bookingName);
    const b = normalizeDocName(docName);
    return a === b;
}

// ─── Visa Requirements ────────────────────────────────────

export type VisaStatus = 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'visa_required' | 'unknown';

export interface VisaRequirement {
    status: VisaStatus;
    maxStayDays: number | null;
    notes: string;
    lastUpdated: string;
}

/**
 * Lookup visa requirements for a nationality → destination pair.
 * This is a client-side stub with common pairs.
 * In production, this would query a Firestore `visa_requirements` collection.
 */
const VISA_DB: Record<string, Record<string, VisaRequirement>> = {
    // Gambian passport holders
    GM: {
        GB: { status: 'visa_required', maxStayDays: null, notes: 'Standard visitor visa required. Apply at UK Visa Application Centre.', lastUpdated: '2026-01' },
        US: { status: 'visa_required', maxStayDays: null, notes: 'B-1/B-2 visitor visa required. Interview at US Embassy.', lastUpdated: '2026-01' },
        SN: { status: 'visa_free', maxStayDays: 90, notes: 'ECOWAS free movement. National ID card accepted.', lastUpdated: '2026-01' },
        NG: { status: 'visa_free', maxStayDays: 90, notes: 'ECOWAS free movement.', lastUpdated: '2026-01' },
        GH: { status: 'visa_free', maxStayDays: 90, notes: 'ECOWAS free movement.', lastUpdated: '2026-01' },
        MA: { status: 'visa_on_arrival', maxStayDays: 90, notes: 'Visa on arrival for tourism.', lastUpdated: '2026-01' },
        TR: { status: 'e_visa', maxStayDays: 30, notes: 'e-Visa available online at evisa.gov.tr.', lastUpdated: '2026-01' },
        AE: { status: 'visa_on_arrival', maxStayDays: 30, notes: '30-day visa on arrival for tourism.', lastUpdated: '2026-01' },
    },
    // UK passport holders
    GB: {
        US: { status: 'visa_free', maxStayDays: 90, notes: 'ESTA required. Apply at least 72 hours before travel.', lastUpdated: '2026-01' },
        GM: { status: 'visa_on_arrival', maxStayDays: 90, notes: 'Visa on arrival available. Bring proof of accommodation.', lastUpdated: '2026-01' },
        FR: { status: 'visa_free', maxStayDays: 90, notes: '90 days in any 180-day period (Schengen).', lastUpdated: '2026-01' },
        AE: { status: 'visa_free', maxStayDays: 30, notes: 'Visa free on arrival for 30 days.', lastUpdated: '2026-01' },
        NG: { status: 'visa_required', maxStayDays: null, notes: 'Visa required. Apply via Nigeria Immigration Portal.', lastUpdated: '2026-01' },
    },
    // US passport holders
    US: {
        GB: { status: 'visa_free', maxStayDays: 180, notes: 'Up to 6 months for tourism. No visa required.', lastUpdated: '2026-01' },
        GM: { status: 'visa_on_arrival', maxStayDays: 90, notes: 'Visa on arrival available.', lastUpdated: '2026-01' },
        FR: { status: 'visa_free', maxStayDays: 90, notes: '90 days in any 180-day period (Schengen).', lastUpdated: '2026-01' },
        AE: { status: 'visa_free', maxStayDays: 30, notes: 'Visa free on arrival for 30 days.', lastUpdated: '2026-01' },
        NG: { status: 'visa_required', maxStayDays: null, notes: 'Visa required. Apply at Nigerian embassy.', lastUpdated: '2026-01' },
    },
    // Nigerian passport holders
    NG: {
        GM: { status: 'visa_free', maxStayDays: 90, notes: 'ECOWAS free movement.', lastUpdated: '2026-01' },
        GB: { status: 'visa_required', maxStayDays: null, notes: 'Standard visitor visa required.', lastUpdated: '2026-01' },
        US: { status: 'visa_required', maxStayDays: null, notes: 'B-1/B-2 visa required. Interview at US Embassy.', lastUpdated: '2026-01' },
        GH: { status: 'visa_free', maxStayDays: 90, notes: 'ECOWAS free movement.', lastUpdated: '2026-01' },
        AE: { status: 'visa_on_arrival', maxStayDays: 30, notes: '30-day visa on arrival.', lastUpdated: '2026-01' },
    },
};

export function checkVisaRequirements(
    nationalityCode: string,
    destinationCode: string,
): VisaRequirement {
    const nationality = nationalityCode.toUpperCase();
    const destination = destinationCode.toUpperCase();

    if (nationality === destination) {
        return {
            status: 'visa_free',
            maxStayDays: null,
            notes: 'Citizens can enter their own country without restrictions.',
            lastUpdated: '2026-01',
        };
    }

    const natDb = VISA_DB[nationality];
    if (natDb && natDb[destination]) {
        return natDb[destination];
    }

    return {
        status: 'unknown',
        maxStayDays: null,
        notes: 'Visa requirements data not available for this combination. Please check with the nearest embassy or consulate of your destination country.',
        lastUpdated: '2026-01',
    };
}

// ─── Country List ──────────────────────────────────────────

export const COUNTRIES = [
    { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
    { code: 'AO', name: 'Angola' }, { code: 'AR', name: 'Argentina' }, { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BE', name: 'Belgium' },
    { code: 'BJ', name: 'Benin' }, { code: 'BR', name: 'Brazil' }, { code: 'BF', name: 'Burkina Faso' },
    { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' }, { code: 'CN', name: 'China' }, { code: 'CD', name: 'DR Congo' },
    { code: 'CI', name: "Côte d'Ivoire" }, { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' },
    { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
    { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' }, { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' }, { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
    { code: 'IE', name: 'Ireland' }, { code: 'IT', name: 'Italy' }, { code: 'JP', name: 'Japan' },
    { code: 'KE', name: 'Kenya' }, { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' },
    { code: 'ML', name: 'Mali' }, { code: 'MR', name: 'Mauritania' }, { code: 'MA', name: 'Morocco' },
    { code: 'NL', name: 'Netherlands' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
    { code: 'NO', name: 'Norway' }, { code: 'PK', name: 'Pakistan' }, { code: 'PH', name: 'Philippines' },
    { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'SA', name: 'Saudi Arabia' },
    { code: 'SN', name: 'Senegal' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
    { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' }, { code: 'ES', name: 'Spain' },
    { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' }, { code: 'TZ', name: 'Tanzania' },
    { code: 'TG', name: 'Togo' }, { code: 'TR', name: 'Turkey' }, { code: 'AE', name: 'United Arab Emirates' },
    { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
];
