import { describe, it, expect } from 'vitest';
import { toLocalDateString, todayString } from '../../src/utils/localDate';
import { exportToCSV } from '../../src/services/reportingService';

describe('localDate — toLocalDateString', () => {
    it('formats a date as YYYY-MM-DD', () => {
        const date = new Date(2026, 4, 13); // May 13, 2026
        expect(toLocalDateString(date)).toBe('2026-05-13');
    });

    it('pads single-digit months and days', () => {
        const date = new Date(2026, 0, 5); // Jan 5, 2026
        expect(toLocalDateString(date)).toBe('2026-01-05');
    });

    it('handles December correctly', () => {
        const date = new Date(2026, 11, 31);
        expect(toLocalDateString(date)).toBe('2026-12-31');
    });
});

describe('localDate — todayString', () => {
    it('returns today in YYYY-MM-DD format', () => {
        const today = todayString();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Should match actual today
        const now = new Date();
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        expect(today).toBe(expected);
    });
});

describe('reportingService — exportToCSV', () => {
    it('is a callable function', () => {
        expect(typeof exportToCSV).toBe('function');
    });
});
