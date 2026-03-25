/**
 * IATA BCBP (Bar Coded Boarding Pass) Encoder
 *
 * Encodes passenger and flight data into a structured string
 * following IATA Resolution 792 format, suitable for QR code rendering.
 *
 * Format (simplified for MVP — mandatory fields only):
 *   M1LASTNAME/FIRSTNAME     EPNRREF ORGDSTXX 1234 123Y012A0001 100
 *
 * Field breakdown:
 *   - Format code: "M" (mandatory)
 *   - Number of legs: "1" (single leg)
 *   - Passenger name: 20 chars, padded with spaces
 *   - Electronic ticket indicator: "E"
 *   - PNR code: 7 chars, padded
 *   - Origin airport: 3 chars (IATA)
 *   - Destination airport: 3 chars (IATA)
 *   - Operating carrier: 2 chars (airline designator)
 *   - Flight number: 5 chars, right-padded
 *   - Julian date: 3 digits (day of year)
 *   - Compartment code: 1 char (Y=economy, C=business, F=first)
 *   - Seat number: 4 chars (e.g., "012A")
 *   - Check-in sequence: 5 chars
 *   - Passenger status: 1 char ("0"=normal)
 */

export interface BCBPInput {
    passengerName: string;  // "LASTNAME/FIRSTNAME"
    pnr: string;            // 6-char PNR
    origin: string;         // 3-char IATA airport code
    destination: string;    // 3-char IATA airport code
    carrierCode: string;    // 2-char airline code (e.g., "DB")
    flightNumber: string;   // Flight number (e.g., "DB-101" → "0101")
    departureDate: Date;    // Departure date (for Julian day)
    compartment: string;    // Cabin class: F, C, Y
    seatNumber: string;     // e.g., "14A"
    sequenceNumber: number; // Check-in sequence (1-based)
    eTicketNumber?: string; // Optional e-ticket number
}

/**
 * Pad or trim a string to exact length.
 */
function pad(value: string, length: number): string {
    return value.toUpperCase().padEnd(length, ' ').slice(0, length);
}

/**
 * Convert a Date to Julian day (1-366).
 */
function toJulianDay(date: Date): string {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return String(day).padStart(3, '0');
}

/**
 * Normalize a seat number to 4 chars: "14A" → "014A", "3F" → "003F".
 */
function normalizeSeat(seat: string): string {
    const match = seat.match(/^(\d+)([A-Z])$/i);
    if (!match) return pad(seat, 4);
    return match[1].padStart(3, '0') + match[2].toUpperCase();
}

/**
 * Extract numeric flight number from strings like "DB-101" → "0101".
 */
function normalizeFlightNumber(flightNum: string): string {
    const digits = flightNum.replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 5);
}

/**
 * Map fare class to IATA compartment code.
 */
export function fareClassToCompartment(fareClass: string): string {
    const fc = (fareClass || '').toLowerCase();
    if (fc.includes('first')) return 'F';
    if (fc.includes('business')) return 'C';
    return 'Y'; // Economy / default
}

/**
 * Encode booking data into IATA BCBP format string.
 * This string is what gets encoded into the QR code.
 */
export function encodeBCBP(input: BCBPInput): string {
    const formatCode = 'M';           // Mandatory item
    const numberOfLegs = '1';
    const name = pad(input.passengerName, 20);
    const eTicketIndicator = 'E';
    const pnr = pad(input.pnr, 7);
    const origin = pad(input.origin, 3);
    const destination = pad(input.destination, 3);
    const carrier = pad(input.carrierCode, 3);
    const flightNum = normalizeFlightNumber(input.flightNumber).padEnd(5, ' ');
    const julianDate = toJulianDay(input.departureDate);
    const compartment = input.compartment || 'Y';
    const seat = normalizeSeat(input.seatNumber);
    const sequence = String(input.sequenceNumber).padStart(5, '0');
    const passengerStatus = '0';      // Normal

    // Construct BCBP string
    const bcbp = [
        formatCode,
        numberOfLegs,
        name,
        eTicketIndicator,
        pnr,
        origin,
        destination,
        carrier,
        flightNum,
        julianDate,
        compartment,
        seat,
        sequence,
        passengerStatus,
    ].join('');

    return bcbp;
}

/**
 * Decode a BCBP string back into structured data (for scanner validation).
 * Returns null if string is too short or malformed.
 */
export function decodeBCBP(bcbp: string): BCBPInput | null {
    if (!bcbp || bcbp.length < 58) return null;

    try {
        let pos = 0;
        const formatCode = bcbp.slice(pos, pos += 1);     // "M"
        const legs = bcbp.slice(pos, pos += 1);            // "1"
        const name = bcbp.slice(pos, pos += 20).trim();    // Passenger name
        const eTicket = bcbp.slice(pos, pos += 1);         // "E"
        const pnr = bcbp.slice(pos, pos += 7).trim();
        const origin = bcbp.slice(pos, pos += 3).trim();
        const destination = bcbp.slice(pos, pos += 3).trim();
        const carrier = bcbp.slice(pos, pos += 3).trim();
        const flightNum = bcbp.slice(pos, pos += 5).trim();
        const julianDay = bcbp.slice(pos, pos += 3);
        const compartment = bcbp.slice(pos, pos += 1);
        const seat = bcbp.slice(pos, pos += 4).trim();
        const sequence = bcbp.slice(pos, pos += 5).trim();

        if (formatCode !== 'M') return null;

        return {
            passengerName: name,
            pnr,
            origin,
            destination,
            carrierCode: carrier,
            flightNumber: flightNum,
            departureDate: new Date(), // Julian date would need year context
            compartment,
            seatNumber: seat,
            sequenceNumber: parseInt(sequence, 10) || 1,
        };
    } catch {
        return null;
    }
}
