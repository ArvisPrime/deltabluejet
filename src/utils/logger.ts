/**
 * ═══════════════════════════════════════════════════════════
 * Production-Safe Logger
 * ═══════════════════════════════════════════════════════════
 * Wraps console methods to suppress detailed output in production.
 * In development: behaves exactly like console.
 * In production: only logs warnings and errors as concise messages
 * without stack traces or implementation details.
 */

const isDev = import.meta.env.DEV;

/**
 * Log an error. In production, logs a generic message only.
 * Use this instead of `console.error` throughout the app.
 */
export function logError(context: string, error?: unknown): void {
    if (isDev) {
        console.error(`[${context}]`, error);
    } else {
        // In production: log only the context label — no stack traces
        console.error(`[${context}] An error occurred`);
    }
}

/**
 * Log a warning. In production, logs a concise message only.
 */
export function logWarn(context: string, ...args: unknown[]): void {
    if (isDev) {
        console.warn(`[${context}]`, ...args);
    }
    // Suppress warnings entirely in production
}

/**
 * Log informational messages. Only visible in development.
 */
export function logInfo(context: string, ...args: unknown[]): void {
    if (isDev) {
        console.log(`[${context}]`, ...args);
    }
}

/**
 * Log debug messages. Only visible in development.
 */
export function logDebug(context: string, ...args: unknown[]): void {
    if (isDev) {
        console.debug(`[${context}]`, ...args);
    }
}
