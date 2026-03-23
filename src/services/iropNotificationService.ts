/**
 * IROP Notification Service — Deltablue Jet Air
 *
 * Templated disruption notifications for passengers.
 * Uses existing notification infrastructure (sendNotification CF).
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ─── Types ─────────────────────────────────────────────────

export type IROPNotificationType =
    | 'delay'
    | 'cancellation'
    | 'rebooking'
    | 'gate_change'
    | 'voucher_issued'
    | 'compensation';

export interface IROPNotification {
    recipientEmail: string;
    recipientPhone?: string;
    type: IROPNotificationType;
    flightNumber: string;
    passengerName: string;
    subject: string;
    body: string;
    channels: ('email' | 'sms')[];
    sent: boolean;
    createdAt: Timestamp;
}

// ─── Message Templates ─────────────────────────────────────

const TEMPLATES: Record<IROPNotificationType, { subject: string; body: string }> = {
    delay: {
        subject: 'Flight {{flightNumber}} — Delay Notification',
        body: `Dear {{passengerName}},

We regret to inform you that flight {{flightNumber}} has been delayed. The new estimated departure time is {{newTime}}.

We apologize for the inconvenience and are working to minimize your wait. {{voucherInfo}}

Thank you for your patience.
— DeltaBlue Jet Air`,
    },
    cancellation: {
        subject: 'Flight {{flightNumber}} — Cancellation Notice',
        body: `Dear {{passengerName}},

We regret to inform you that flight {{flightNumber}} scheduled for {{originalDate}} has been cancelled.

{{rebookingInfo}}

If you prefer a full refund, please contact our support team or visit your booking management page.

We sincerely apologize for the disruption.
— DeltaBlue Jet Air`,
    },
    rebooking: {
        subject: 'Flight {{flightNumber}} — Rebooking Confirmation',
        body: `Dear {{passengerName}},

You have been rebooked on flight {{newFlightNumber}} departing at {{newTime}}.

Your original booking reference remains the same. Your seat assignment will be confirmed at check-in.

— DeltaBlue Jet Air`,
    },
    gate_change: {
        subject: 'Flight {{flightNumber}} — Gate Change',
        body: `Dear {{passengerName}},

Please note that flight {{flightNumber}} has been moved to Gate {{newGate}}, {{terminal}}.

Please proceed to the new gate. Boarding will begin at {{boardingTime}}.

— DeltaBlue Jet Air`,
    },
    voucher_issued: {
        subject: 'Flight {{flightNumber}} — Voucher Issued',
        body: `Dear {{passengerName}},

Due to the disruption to flight {{flightNumber}}, we have issued the following voucher(s):

{{voucherDetails}}

These can be redeemed at the airport or through your booking portal.

— DeltaBlue Jet Air`,
    },
    compensation: {
        subject: 'Flight {{flightNumber}} — Compensation Notice',
        body: `Dear {{passengerName}},

In accordance with passenger rights regulations, you are entitled to compensation of {{amount}} for the disruption to flight {{flightNumber}}.

This will be processed to your original payment method within 7-14 business days.

— DeltaBlue Jet Air`,
    },
};

// ─── Template Interpolation ────────────────────────────────

function interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
}

// ─── Send Single Notification ──────────────────────────────

/**
 * Queue an IROP notification for a passenger.
 */
export async function sendIROPNotification(
    type: IROPNotificationType,
    recipientEmail: string,
    flightNumber: string,
    passengerName: string,
    variables: Record<string, string> = {},
    recipientPhone?: string,
): Promise<string> {
    const template = TEMPLATES[type];
    const allVars = { flightNumber, passengerName, ...variables };

    const notification: Omit<IROPNotification, 'id'> = {
        recipientEmail,
        recipientPhone,
        type,
        flightNumber,
        passengerName,
        subject: interpolate(template.subject, allVars),
        body: interpolate(template.body, allVars),
        channels: recipientPhone ? ['email', 'sms'] : ['email'],
        sent: false,
        createdAt: Timestamp.now(),
    };

    const ref = await addDoc(collection(db, 'irop_notifications'), notification);
    return ref.id;
}

// ─── Batch Send ────────────────────────────────────────────

export interface BatchRecipient {
    email: string;
    phone?: string;
    name: string;
}

/**
 * Send disruption notifications to multiple passengers at once.
 */
export async function sendBatchIROPNotification(
    type: IROPNotificationType,
    flightNumber: string,
    recipients: BatchRecipient[],
    variables: Record<string, string> = {},
): Promise<string[]> {
    const ids: string[] = [];
    for (const recipient of recipients) {
        const id = await sendIROPNotification(
            type,
            recipient.email,
            flightNumber,
            recipient.name,
            variables,
            recipient.phone,
        );
        ids.push(id);
    }
    return ids;
}
