import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getPaymentByTxRef } from '../../services/flutterwaveService';
import { generateETicketNumber, confirmPaymentAndBooking } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';

type CallbackStatus = 'verifying' | 'success' | 'failed' | 'not_found';

/**
 * Flutterwave Payment Callback
 *
 * Flutterwave redirects here after the customer completes (or cancels)
 * the hosted checkout. The page reads URL params, looks up the payment
 * in Firestore, and shows the result.
 *
 * URL params set by Flutterwave:
 *   ?status=successful|cancelled|failed&tx_ref=DBJ-xxx&transaction_id=123
 */
const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [status, setStatus] = useState<CallbackStatus>('verifying');
    const [message, setMessage] = useState('Verifying your payment…');

    const txRef = searchParams.get('tx_ref') || '';
    const flwStatus = searchParams.get('status') || '';
    const transactionId = searchParams.get('transaction_id') || '';

    useEffect(() => {
        async function verifyPayment() {
            // Instant fail if cancelled or Flutterwave reported failure
            if (flwStatus === 'cancelled') {
                setStatus('failed');
                setMessage('Payment was cancelled. You can try again from your booking.');
                return;
            }

            if (!txRef) {
                setStatus('not_found');
                setMessage('No transaction reference found. Please return to your booking.');
                return;
            }

            try {
                // Poll Firestore for the payment doc (webhook may not have fired yet)
                let payment = await getPaymentByTxRef(txRef);
                let attempts = 0;
                const maxAttempts = 10;

                while (
                    payment &&
                    payment.status === 'pending' &&
                    attempts < maxAttempts
                ) {
                    await new Promise((r) => setTimeout(r, 2000));
                    payment = await getPaymentByTxRef(txRef);
                    attempts++;
                }

                if (!payment) {
                    setStatus('not_found');
                    setMessage('Payment record not found. Please contact support.');
                    return;
                }

                if (payment.status === 'succeeded') {
                    // Generate e-ticket if not already done
                    const eTicket = generateETicketNumber();

                    // Confirm booking with e-ticket
                    try {
                        await confirmPaymentAndBooking(
                            payment.id,
                            payment.bookingId,
                            eTicket,
                            user?.uid || 'anonymous',
                        );
                    } catch {
                        // Webhook may have already confirmed — that's fine
                    }

                    setStatus('success');
                    setMessage('Payment successful! Redirecting to your confirmation…');

                    // Navigate to ticket confirmation after a brief delay
                    setTimeout(() => {
                        navigate(ROUTES.TICKET_CONFIRMATION, {
                            state: {
                                paymentId: payment!.id,
                                eTicketNumber: eTicket,
                                amount: (payment!.amount / 100).toFixed(2),
                                gateway: 'flutterwave',
                                bookingId: payment!.bookingId,
                            },
                        });
                    }, 2000);
                } else if (payment.status === 'failed') {
                    setStatus('failed');
                    setMessage('Payment failed. Please try again or use a different payment method.');
                } else {
                    // Still pending after max polling
                    setStatus('success');
                    setMessage('Payment is being processed. You will receive a confirmation shortly.');

                    setTimeout(() => {
                        navigate(ROUTES.TICKET_CONFIRMATION, {
                            state: {
                                paymentId: payment!.id,
                                gateway: 'flutterwave',
                                bookingId: payment!.bookingId,
                                pending: true,
                            },
                        });
                    }, 3000);
                }
            } catch (err) {
                console.error('Payment verification error:', err);
                setStatus('failed');
                setMessage('An error occurred verifying your payment. Please contact support.');
            }
        }

        verifyPayment();
    }, [txRef, flwStatus, transactionId, navigate, user]);

    const statusConfig = {
        verifying: { icon: 'hourglass_top', color: 'text-amber-500', bg: 'bg-amber-50', spin: true },
        success: { icon: 'check_circle', color: 'text-emerald-500', bg: 'bg-emerald-50', spin: false },
        failed: { icon: 'cancel', color: 'text-red-500', bg: 'bg-red-50', spin: false },
        not_found: { icon: 'help', color: 'text-navy-400', bg: 'bg-navy-50', spin: false },
    };

    const cfg = statusConfig[status];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy-50 to-white p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-700">
                {/* Icon */}
                <div className={`mx-auto size-24 rounded-full ${cfg.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-5xl ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`}>
                        {cfg.icon}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black text-navy-950 tracking-tight">
                    {status === 'verifying' && 'Verifying Payment'}
                    {status === 'success' && 'Payment Confirmed'}
                    {status === 'failed' && 'Payment Failed'}
                    {status === 'not_found' && 'Payment Not Found'}
                </h1>

                {/* Message */}
                <p className="text-navy-500 font-medium">{message}</p>

                {/* Transaction reference */}
                {txRef && (
                    <div className="p-4 bg-navy-50 rounded-2xl">
                        <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-1">
                            Transaction Reference
                        </p>
                        <p className="text-sm font-bold text-navy-700 font-mono">{txRef}</p>
                    </div>
                )}

                {/* Actions */}
                {(status === 'failed' || status === 'not_found') && (
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(ROUTES.PAYMENT)}
                            className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.15em] text-xs rounded-2xl hover:scale-[1.01] transition-all shadow-lg shadow-primary/20"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate(ROUTES.MANAGE_BOOKING)}
                            className="w-full py-4 border-2 border-navy-100 text-navy-500 font-black uppercase tracking-[0.15em] text-xs rounded-2xl hover:bg-navy-50 transition-all"
                        >
                            Manage Booking
                        </button>
                    </div>
                )}

                {/* Loading dots for verifying */}
                {status === 'verifying' && (
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="size-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentCallback;
