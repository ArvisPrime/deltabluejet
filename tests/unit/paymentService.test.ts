import { describe, it, expect } from 'vitest';
import { generateETicketNumber, calculateRefund } from '../../src/services/paymentService';

describe('paymentService — generateETicketNumber', () => {
    it('generates a string in DBJ-YYYYMMDD-XXXXXX format', () => {
        const ticket = generateETicketNumber();
        expect(ticket).toMatch(/^DBJ-\d{8}-[A-Z0-9]{1,6}$/);
    });

    it('starts with DBJ- prefix', () => {
        expect(generateETicketNumber().startsWith('DBJ-')).toBe(true);
    });

    it('generates unique tickets on successive calls', () => {
        const tickets = new Set(Array.from({ length: 100 }, () => generateETicketNumber()));
        expect(tickets.size).toBe(100);
    });

    it('embeds today date in the ticket', () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const ticket = generateETicketNumber();
        expect(ticket).toContain(`${y}${m}${d}`);
    });
});

describe('paymentService — calculateRefund', () => {
    it('returns a refund calculation object', () => {
        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const result = calculateRefund(50000, future, 'economy');
        expect(result).toHaveProperty('eligible');
        expect(result).toHaveProperty('percentage');
        expect(result).toHaveProperty('refundAmount');
        expect(result).toHaveProperty('reason');
    });

    it('refund amount is never negative', () => {
        const past = new Date(Date.now() - 1000);
        const result = calculateRefund(50000, past, 'economy');
        expect(result.refundAmount).toBeGreaterThanOrEqual(0);
    });

    it('refund percentage is 0-100', () => {
        const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const result = calculateRefund(50000, future, 'business');
        expect(result.percentage).toBeGreaterThanOrEqual(0);
        expect(result.percentage).toBeLessThanOrEqual(100);
    });

    it('reason string is descriptive', () => {
        const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const result = calculateRefund(50000, future);
        expect(typeof result.reason).toBe('string');
        expect(result.reason.length).toBeGreaterThan(0);
    });
});
