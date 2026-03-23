import React, { useState, useMemo } from 'react';
import type { PaymentDoc, BookingDoc } from '../../types/firestore';
import { calculateRefund, processRefund, type RefundCalculation } from '../../services/paymentService';
import { useToastStore } from '../../stores/toastStore';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../hooks/useCurrency';

interface RefundPanelProps {
    payment: PaymentDoc;
    booking: BookingDoc;
    departureDate: Date;
    onRefundComplete: () => void;
    onClose: () => void;
}

const RefundPanel: React.FC<RefundPanelProps> = ({
    payment,
    booking,
    departureDate,
    onRefundComplete,
    onClose,
}) => {
    const { user } = useAuth();
    const { display } = useCurrency();
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const refundCalc = useMemo<RefundCalculation>(() => {
        return calculateRefund(payment.amount, departureDate);
    }, [payment.amount, departureDate]);

    const handleRefund = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for the refund.');
            return;
        }
        setProcessing(true);
        setError('');

        try {
            await processRefund(
                payment.id,
                booking.id,
                departureDate,
                user?.uid || 'unknown',
                reason,
            );
            onRefundComplete();
        } catch (err) {
            console.error('Refund failed:', err);
            useToastStore.getState().addToast("Refund failed", "error");
            setError('Failed to process refund. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const displayAmount = (cents: number) => display(cents / 100);
    const hoursUntil = Math.max(0, Math.round((departureDate.getTime() - Date.now()) / (1000 * 60 * 60)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-navy-100 shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 py-5 border-b border-navy-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-lg">undo</span>
                        </div>
                        <h2 className="text-lg font-black text-navy-950 tracking-tight">Process Refund</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-navy-100 rounded-lg">
                        <span className="material-symbols-outlined text-navy-400 text-sm">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">{error}</div>
                    )}

                    {/* Original Payment */}
                    <div className="p-4 bg-navy-50/30 rounded-xl border border-navy-50 space-y-2">
                        <p className="text-[9px] font-black text-navy-300 uppercase tracking-widest">Original Payment</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm font-bold text-navy-700">Booking {booking.pnr}</p>
                                <p className="text-[10px] text-navy-400">{payment.metadata?.flightNumber} • {payment.metadata?.route}</p>
                            </div>
                            <p className="text-lg font-black text-navy-950">{displayAmount(payment.amount)}</p>
                        </div>
                    </div>

                    {/* Refund Rules */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-navy-400 uppercase tracking-widest">Fare Rules</p>
                        <div className="space-y-2">
                            {[
                                { label: '> 48h before departure', pct: '100%', active: hoursUntil > 48 },
                                { label: '24–48h before departure', pct: '50%', active: hoursUntil >= 24 && hoursUntil <= 48 },
                                { label: '< 24h before departure', pct: 'No refund', active: hoursUntil < 24 },
                            ].map((rule) => (
                                <div
                                    key={rule.label}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${rule.active
                                            ? 'bg-primary/5 border-primary/30 text-navy-800'
                                            : 'bg-navy-50/20 border-navy-50 text-navy-400'
                                        }`}
                                >
                                    <span className="font-bold">{rule.label}</span>
                                    <span className={`font-black ${rule.active ? 'text-primary' : ''}`}>{rule.pct}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-navy-400 font-medium">
                            Time until departure: <strong className="text-navy-700">{hoursUntil} hours</strong>
                        </p>
                    </div>

                    {/* Refund Calculation */}
                    <div className={`p-4 rounded-xl border ${refundCalc.eligible ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
                        }`}>
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2 ${
                            refundCalc.eligible ? 'text-emerald-500' : 'text-red-500'
                        }">{refundCalc.eligible ? 'Eligible for Refund' : 'Not Eligible'}</p>
                        <div className="flex justify-between items-end">
                            <p className="text-xs font-medium text-navy-600">{refundCalc.reason}</p>
                            <p className={`text-xl font-black ${refundCalc.eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                                {displayAmount(refundCalc.refundAmount)}
                            </p>
                        </div>
                    </div>

                    {/* Reason */}
                    {refundCalc.eligible && (
                        <div>
                            <label className="block text-[9px] font-black text-navy-400 uppercase tracking-widest mb-1.5">Reason for Refund</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Enter reason for refund..."
                                className="w-full px-3 py-2 rounded-xl border border-navy-100 text-sm font-medium text-navy-800 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-navy-100 text-navy-500 font-black text-[10px] uppercase tracking-widest hover:bg-navy-50 transition-all"
                        >
                            Cancel
                        </button>
                        {refundCalc.eligible && (
                            <button
                                onClick={handleRefund}
                                disabled={processing || !reason.trim()}
                                className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : `Refund ${displayAmount(refundCalc.refundAmount)}`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPanel;
