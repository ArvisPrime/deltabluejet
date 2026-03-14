/**
 * Notification Triggers — Event-driven notification dispatch.
 *
 * These functions are called from the frontend when booking/flight events occur.
 * In production, these would be Cloud Function Firestore triggers.
 */

import {
    collection,
    getDocs,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
    sendBookingConfirmation,
    sendCheckInReminder,
    sendFlightStatusAlert,
} from './notificationDispatcher';

// ─── Booking Confirmed Trigger ─────────────────────────────

/**
 * Called when a booking is confirmed (after successful payment).
 * Dispatches confirmation email + SMS.
 */
export async function onBookingConfirmed(params: {
    bookingId: string;
    pnr: string;
    passengerName: string;
    passengerEmail: string;
    passengerPhone?: string;
    flightNumber: string;
    route: string;
    departureDate: string;
    eTicketNumber: string;
    amountPaid: string;
}): Promise<void> {
    try {
        await sendBookingConfirmation({
            recipientEmail: params.passengerEmail,
            recipientPhone: params.passengerPhone,
            passengerName: params.passengerName,
            pnr: params.pnr,
            flightNumber: params.flightNumber,
            route: params.route,
            departureDate: params.departureDate,
            eTicketNumber: params.eTicketNumber,
            amountPaid: params.amountPaid,
        });
        console.log(`[NotificationTrigger] Booking confirmation sent for ${params.pnr}`);
    } catch (err) {
        console.error(`[NotificationTrigger] Failed to send booking confirmation for ${params.pnr}:`, err);
    }
}

// ─── Flight Status Change Trigger ──────────────────────────

/**
 * Called when a flight's status changes (delayed, cancelled, gate change).
 * Finds all bookings for the flight and notifies passengers.
 */
export async function onFlightStatusChanged(params: {
    flightId: string;
    flightNumber: string;
    route: string;
    statusChange: string;
    newDepartureTime?: string;
}): Promise<void> {
    try {
        // Find all bookings for this flight
        const bookingsSnap = await getDocs(
            query(
                collection(db, 'bookings'),
                where('flightId', '==', params.flightId),
                where('status', '==', 'confirmed'),
            ),
        );

        for (const bookingDoc of bookingsSnap.docs) {
            const booking = bookingDoc.data();

            await sendFlightStatusAlert({
                recipientEmail: booking.contactEmail || booking.email || '',
                recipientPhone: booking.contactPhone,
                passengerName: booking.passengerName || booking.leadPassenger || 'Passenger',
                pnr: booking.pnr || bookingDoc.id,
                flightNumber: params.flightNumber,
                route: params.route,
                statusChange: params.statusChange,
                newDepartureTime: params.newDepartureTime,
            });
        }

        console.log(
            `[NotificationTrigger] Flight status alert sent for ${params.flightNumber} — ${bookingsSnap.size} passengers notified`,
        );
    } catch (err) {
        console.error(`[NotificationTrigger] Failed to send flight status alerts for ${params.flightNumber}:`, err);
    }
}

// ─── Check-In Reminder (Scheduled) ─────────────────────────

/**
 * Finds flights departing within the next 24 hours and sends
 * check-in reminders to all confirmed booking passengers.
 *
 * In production, this would be a Cloud Scheduler cron job.
 * On the frontend, it can be called manually or periodically.
 */
export async function checkForUpcomingDepartures(): Promise<number> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find flights departing in the next 24 hours
    const flightsSnap = await getDocs(
        query(
            collection(db, 'flights'),
            where('status', '==', 'scheduled'),
            where('departureTime', '>=', Timestamp.fromDate(now)),
            where('departureTime', '<=', Timestamp.fromDate(in24h)),
        ),
    );

    let remindersSent = 0;

    for (const flightDoc of flightsSnap.docs) {
        const flight = flightDoc.data();

        // Find confirmed bookings for this flight
        const bookingsSnap = await getDocs(
            query(
                collection(db, 'bookings'),
                where('flightId', '==', flightDoc.id),
                where('status', '==', 'confirmed'),
            ),
        );

        for (const bookingDoc of bookingsSnap.docs) {
            const booking = bookingDoc.data();
            const depTime = flight.departureTime?.toDate?.() || new Date();

            await sendCheckInReminder({
                recipientEmail: booking.contactEmail || booking.email || '',
                recipientPhone: booking.contactPhone,
                passengerName: booking.passengerName || booking.leadPassenger || 'Passenger',
                pnr: booking.pnr || bookingDoc.id,
                flightNumber: flight.flightNumber || '',
                route: `${flight.origin?.code || ''} → ${flight.destination?.code || ''}`,
                departureDate: depTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                }),
                departureTime: depTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }),
            });

            remindersSent++;
        }
    }

    console.log(`[NotificationTrigger] Check-in reminders sent: ${remindersSent}`);
    return remindersSent;
}
