/**
 * ═══════════════════════════════════════════════════════════
 * Web Vitals Performance Monitoring
 * ═══════════════════════════════════════════════════════════
 * Reports Core Web Vitals (CLS, FID, FCP, LCP, TTFB) to the
 * console in development. In production, silently captures
 * metrics — ready for integration with an analytics provider
 * (e.g., Google Analytics, Firebase Performance, Sentry).
 *
 * Call reportWebVitals() once in main.tsx after ReactDOM.render.
 */

import type { Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric): void {
    // In development, log to console for debugging
    if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}:`, Math.round(metric.value * 100) / 100, metric.rating);
    }

    // In production, send to your analytics endpoint:
    // Example: Google Analytics
    // gtag('event', metric.name, {
    //     event_category: 'Web Vitals',
    //     event_label: metric.id,
    //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //     non_interaction: true,
    // });
}

export default function reportWebVitals(): void {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        onINP(sendToAnalytics);
    });
}
