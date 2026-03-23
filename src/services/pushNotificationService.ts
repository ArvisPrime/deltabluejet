/**
 * Push Notification Service — Deltablue Jet Air
 *
 * Firebase Cloud Messaging setup, permission request, token management.
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Service Worker Registration ───────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
        console.log('Service worker registered:', registration.scope);
        return registration;
    } catch (err) {
        console.error('Service worker registration failed:', err);
        return null;
    }
}

// ─── Push Permission ───────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
}

// ─── Token Management ──────────────────────────────────────

/**
 * Stores the FCM push token in the user's Firestore profile.
 * In production this would use firebase/messaging getToken().
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
        notificationsEnabled: true,
    } as any);
}

/**
 * Removes the push token from the user's profile (opt out).
 */
export async function removePushToken(userId: string): Promise<void> {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, {
        pushToken: null,
        notificationsEnabled: false,
        pushTokenUpdatedAt: serverTimestamp(),
    } as any);
}

// ─── Local Notification (for testing / fallback) ───────────

export function showLocalNotification(title: string, body: string, url?: string): void {
    if (Notification.permission !== 'granted') return;

    new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/favicon.ico',
        data: { url: url || '/' },
    });
}

// ─── Topic Subscriptions ───────────────────────────────────

export type NotificationTopic =
    | 'flight_updates'
    | 'promotions'
    | 'loyalty'
    | 'disruptions'
    | 'booking_reminders';

/**
 * Subscribe/unsubscribe from notification topics.
 * In production this would call FCM topic management APIs.
 */
export async function updateTopicSubscriptions(
    userId: string,
    topics: Record<NotificationTopic, boolean>,
): Promise<void> {
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, {
        notificationTopics: topics,
        notificationTopicsUpdatedAt: serverTimestamp(),
    } as any);
}

// ─── Init ──────────────────────────────────────────────────

/**
 * Initialize push notifications:
 * 1. Register service worker
 * 2. Request permission
 * 3. Get and store token
 */
export async function initializePushNotifications(userId: string): Promise<boolean> {
    const registration = await registerServiceWorker();
    if (!registration) return false;

    const permitted = await requestNotificationPermission();
    if (!permitted) return false;

    // In production, use getToken from firebase/messaging
    // For now, generate a placeholder token
    const token = `fcm_${userId}_${Date.now()}`;
    await savePushToken(userId, token);

    return true;
}
