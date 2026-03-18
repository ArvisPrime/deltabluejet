/**
 * Payment Analytics Service — Deltablue Jet Air
 *
 * Queries the `payments` collection for multi-gateway analytics:
 * gateway breakdown, payment method distribution, mobile money
 * provider stats, currency split, and success/failure rates.
 */

import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { PaymentDoc } from '../types/firestore';
import { convertToUSD, getExchangeRates } from './currencyService';

// ─── Types ─────────────────────────────────────────────────

export interface GatewayBreakdown {
    gateway: string;
    revenue: number;          // in USD (normalized)
    transactions: number;
    successRate: number;       // 0-100
    percentage: number;        // share of total revenue
}

export interface PaymentMethodBreakdown {
    method: string;            // 'card' | 'mobilemoney' | 'banktransfer'
    label: string;             // Display name
    revenue: number;
    transactions: number;
    percentage: number;
}

export interface MobileMoneyProviderStats {
    provider: string;          // 'wave' | 'orange_money' | 'afrimoney' | 'qmoney'
    label: string;
    revenue: number;
    transactions: number;
    color: string;
}

export interface CurrencySplit {
    currency: string;
    originalRevenue: number;   // In original currency
    revenueUSD: number;        // Normalized to USD
    transactions: number;
    percentage: number;
}

export interface PaymentHealthStats {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    overallSuccessRate: number;
    stripeSuccessRate: number;
    flutterwaveSuccessRate: number;
    totalRevenueUSD: number;
    totalRevenueGMD: number;
    exchangeRate: number;
    lastReconciliationDate: string | null;
}

// ─── Data Fetching ─────────────────────────────────────────

async function fetchPayments(days: number): Promise<PaymentDoc[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceTs = Timestamp.fromDate(since);

    const q = query(
        collection(db, 'payments'),
        where('createdAt', '>=', sinceTs),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentDoc);
}

async function fetchLatestReconciliation(): Promise<string | null> {
    const q = query(
        collection(db, 'payment_reconciliation'),
        orderBy('createdAt', 'desc'),
        limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].id; // Document ID is the date key (YYYY-MM-DD)
}

// ─── Mobile Money Provider Metadata ────────────────────────

const PROVIDER_META: Record<string, { label: string; color: string }> = {
    wave: { label: 'Wave', color: '#1B3A5C' },
    orange_money: { label: 'Orange Money', color: '#FF6600' },
    afrimoney: { label: 'AfriMoney', color: '#E31937' },
    qmoney: { label: 'QMoney', color: '#00A651' },
};

const METHOD_LABELS: Record<string, string> = {
    card: 'Credit / Debit Card',
    mobilemoney: 'Mobile Money',
    banktransfer: 'Bank Transfer',
};

// ─── Aggregations ──────────────────────────────────────────

/**
 * Revenue and transaction count breakdown by payment gateway.
 */
export async function getGatewayBreakdown(days = 30): Promise<GatewayBreakdown[]> {
    const payments = await fetchPayments(days);

    const map = new Map<string, { revenue: number; total: number; succeeded: number }>();

    for (const p of payments) {
        const gw = p.gateway || 'stripe'; // Legacy payments default to stripe
        const entry = map.get(gw) || { revenue: 0, total: 0, succeeded: 0 };
        entry.total++;
        if (p.status === 'succeeded') {
            entry.succeeded++;
            entry.revenue += convertToUSD(p.amount, p.currency || 'USD');
        }
        map.set(gw, entry);
    }

    const totalRevenue = Array.from(map.values()).reduce((s, e) => s + e.revenue, 0);

    return Array.from(map.entries()).map(([gateway, data]) => ({
        gateway,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.total,
        successRate: data.total > 0 ? Math.round((data.succeeded / data.total) * 100) : 0,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }));
}

/**
 * Revenue breakdown by payment method (card, mobilemoney, banktransfer).
 */
export async function getPaymentMethodBreakdown(days = 30): Promise<PaymentMethodBreakdown[]> {
    const payments = await fetchPayments(days);

    const map = new Map<string, { revenue: number; transactions: number }>();

    for (const p of payments) {
        if (p.status !== 'succeeded') continue;
        const method = p.paymentMethod || 'card';
        const entry = map.get(method) || { revenue: 0, transactions: 0 };
        entry.revenue += convertToUSD(p.amount, p.currency || 'USD');
        entry.transactions++;
        map.set(method, entry);
    }

    const totalRevenue = Array.from(map.values()).reduce((s, e) => s + e.revenue, 0);

    return Array.from(map.entries()).map(([method, data]) => ({
        method,
        label: METHOD_LABELS[method] || method,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
    }));
}

/**
 * Transaction volume by mobile money provider.
 */
export async function getMobileMoneyProviderStats(days = 30): Promise<MobileMoneyProviderStats[]> {
    const payments = await fetchPayments(days);

    const map = new Map<string, { revenue: number; transactions: number }>();

    for (const p of payments) {
        if (p.status !== 'succeeded') continue;
        if (p.paymentMethod !== 'mobilemoney' || !p.mobileMoneyProvider) continue;

        const provider = p.mobileMoneyProvider;
        const entry = map.get(provider) || { revenue: 0, transactions: 0 };
        entry.revenue += convertToUSD(p.amount, p.currency || 'USD');
        entry.transactions++;
        map.set(provider, entry);
    }

    return Array.from(map.entries())
        .map(([provider, data]) => ({
            provider,
            label: PROVIDER_META[provider]?.label || provider,
            revenue: Math.round(data.revenue * 100) / 100,
            transactions: data.transactions,
            color: PROVIDER_META[provider]?.color || '#94a3b8',
        }))
        .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Revenue split by currency (GMD vs USD).
 */
export async function getCurrencySplit(days = 30): Promise<CurrencySplit[]> {
    const payments = await fetchPayments(days);

    const map = new Map<string, { originalRevenue: number; revenueUSD: number; transactions: number }>();

    for (const p of payments) {
        if (p.status !== 'succeeded') continue;
        const cur = (p.currency || 'USD').toUpperCase();
        const entry = map.get(cur) || { originalRevenue: 0, revenueUSD: 0, transactions: 0 };
        entry.originalRevenue += p.amount;
        entry.revenueUSD += convertToUSD(p.amount, cur);
        entry.transactions++;
        map.set(cur, entry);
    }

    const totalUSD = Array.from(map.values()).reduce((s, e) => s + e.revenueUSD, 0);

    return Array.from(map.entries()).map(([currency, data]) => ({
        currency,
        originalRevenue: Math.round(data.originalRevenue * 100) / 100,
        revenueUSD: Math.round(data.revenueUSD * 100) / 100,
        transactions: data.transactions,
        percentage: totalUSD > 0 ? Math.round((data.revenueUSD / totalUSD) * 100) : 0,
    }));
}

/**
 * Overall payment health statistics.
 */
export async function getPaymentHealthStats(days = 30): Promise<PaymentHealthStats> {
    const payments = await fetchPayments(days);
    const rates = getExchangeRates();
    const lastRecon = await fetchLatestReconciliation();

    let total = 0, succeeded = 0, failed = 0, pending = 0;
    let totalRevenueUSD = 0, totalRevenueGMD = 0;
    let stripeTotal = 0, stripeSuccess = 0;
    let flwTotal = 0, flwSuccess = 0;

    for (const p of payments) {
        total++;
        const gw = p.gateway || 'stripe';

        if (gw === 'stripe') {
            stripeTotal++;
            if (p.status === 'succeeded') stripeSuccess++;
        } else if (gw === 'flutterwave') {
            flwTotal++;
            if (p.status === 'succeeded') flwSuccess++;
        }

        if (p.status === 'succeeded') {
            succeeded++;
            const cur = (p.currency || 'USD').toUpperCase();
            if (cur === 'USD') {
                totalRevenueUSD += p.amount;
                totalRevenueGMD += p.amount * rates.GMD_PER_USD;
            } else if (cur === 'GMD') {
                totalRevenueGMD += p.amount;
                totalRevenueUSD += p.amount * rates.USD_PER_GMD;
            }
        } else if (p.status === 'failed') {
            failed++;
        } else if (p.status === 'pending') {
            pending++;
        }
    }

    return {
        totalTransactions: total,
        successfulTransactions: succeeded,
        failedTransactions: failed,
        pendingTransactions: pending,
        overallSuccessRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
        stripeSuccessRate: stripeTotal > 0 ? Math.round((stripeSuccess / stripeTotal) * 100) : 0,
        flutterwaveSuccessRate: flwTotal > 0 ? Math.round((flwSuccess / flwTotal) * 100) : 0,
        totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
        totalRevenueGMD: Math.round(totalRevenueGMD),
        exchangeRate: rates.GMD_PER_USD,
        lastReconciliationDate: lastRecon,
    };
}
