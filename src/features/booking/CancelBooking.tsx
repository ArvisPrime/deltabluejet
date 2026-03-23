import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { getBookingByPNR } from '../../services/booking';
import { calculateCancellationFee, getFareRules, type CancellationResult } from '../../services/fareRulesService';
import { useCurrency } from '../../hooks/useCurrency';
import type { BookingDoc } from '../../types/firestore';

const CancelBooking: React.FC = () => {
    const { pnr } = useParams<{ pnr: string }>();
    const navigate = useNavigate();
    const { display } = useCurrency();

    const [booking, setBooking] = useState<BookingDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelResult, setCancelResult] = useState<CancellationResult | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [voucherOption, setVoucherOption] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (!pnr) return;
        setLoading(true);
        getBookingByPNR(pnr)
            .then((b) => {
                if (!b) {
                    setError('Booking not found. Please check your PNR code.');
                    return;
                }
                if (b.status === 'cancelled') {
                    setError('This booking has already been cancelled.');
                    return;
                }
                setBooking(b);

                // Calculate cancellation result
                const departure = b.departureTime?.toDate?.() ?? new Date();
                const hoursUntil = (departure.getTime() - Date.now()) / (1000 * 60 * 60);
                const amountCents = Math.round(b.totalAmount * 100);
                const result = calculateCancellationFee(b.fareClass || 'economy', amountCents, hoursUntil);
                setCancelResult(result);
            })
            .catch(() => setError('Failed to load booking. Please try again.'))
            .finally(() => setLoading(false));
    }, [pnr]);

    const handleCancel = async () => {
        if (!booking) return;
        setProcessing(true);
        try {
            // In production, this would call the cancellation Cloud Function
            // For now, simulate a short delay
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setCompleted(true);
            setShowConfirm(false);
        } catch {
            setError('Failed to process cancellation. Please contact customer service.');
        } finally {
            setProcessing(false);
        }
    };

    const fareRules = booking ? getFareRules(booking.fareClass || 'economy') : null;

    if (loading) {
        return (
            <div className="p-8 max-w-3xl mx-auto font-display">
                <div className="bg-white rounded-3xl border border-navy-100 p-12 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-navy-400 uppercase tracking-widest">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-3xl mx-auto font-display">
                <div className="bg-red-50 rounded-3xl border border-red-100 p-8 flex items-start gap-4">
                    <span className="material-symbols-outlined text-red-500 text-2xl p-3 bg-white rounded-xl shadow-sm shrink-0">error</span>
                    <div>
                        <h2 className="text-sm font-black text-red-800 uppercase tracking-widest mb-2">Unable to Process</h2>
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                        <Link to={ROUTES.MANAGE_BOOKING} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Return to Manage Booking
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="p-8 max-w-3xl mx-auto font-display">
                <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-8 text-center space-y-4 animate-in fade-in duration-500">
                    <span className="material-symbols-outlined text-emerald-500 text-5xl">check_circle</span>
                    <h2 className="text-xl font-black text-navy-900 uppercase tracking-wider">Cancellation Confirmed</h2>
                    <p className="text-sm text-navy-600 font-medium max-w-md mx-auto">
                         {voucherOption
                            ? `A travel voucher of ${display((cancelResult?.refundAmount || 0) / 100)} has been issued to your account. It is valid for 12 months.`
                            : `A refund of ${display((cancelResult?.refundAmount || 0) / 100)} will be processed to your original payment method within 7–14 business days.`
                        }
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                        <Link to={ROUTES.HOME} className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20">
                            Return Home
                        </Link>
                        <Link to={ROUTES.MANAGE_BOOKING} className="px-5 py-2.5 border-2 border-navy-100 text-navy-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-50 transition-colors">
                            Manage Bookings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto font-display space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-navy-50 transition-colors">
                    <span className="material-symbols-outlined text-navy-400">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-navy-950 tracking-tight">Cancel Booking</h1>
                    <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mt-1">PNR: {pnr}</p>
                </div>
            </div>

            {/* Booking Summary */}
            {booking && (
                <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                    <div className="bg-navy-50/50 px-6 py-4 border-b border-navy-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">flight</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Booking Summary</h3>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Flight</span>
                            <p className="text-sm font-black text-navy-900 mt-1">{booking.flightNumber}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Route</span>
                            <p className="text-sm font-black text-navy-900 mt-1">{booking.origin?.code} → {booking.destination?.code}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Fare Class</span>
                            <p className="text-sm font-black text-navy-900 mt-1 capitalize">{booking.fareClass}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Total Paid</span>
                            <p className="text-sm font-black text-primary mt-1">{display(booking.totalAmount ?? 0)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Calculation */}
            {cancelResult && (
                <div className={`rounded-3xl border shadow-sm overflow-hidden ${cancelResult.eligible ? 'bg-white border-navy-100' : 'bg-red-50/50 border-red-100'}`}>
                    <div className="px-6 py-4 border-b border-navy-100 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-xl">calculate</span>
                        <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Refund Calculation</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cancelResult.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {cancelResult.eligible ? `${cancelResult.refundPercent}% Refund` : 'Non-Refundable'}
                            </span>
                            <span className="text-sm font-bold text-navy-500">{cancelResult.tierLabel}</span>
                        </div>

                        <div className="bg-navy-50 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-navy-500">Original Amount</span>
                                <span className="text-navy-900">{display(booking?.totalAmount || 0)}</span>
                            </div>
                            {cancelResult.adminFee > 0 && (
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-navy-500">Administrative Fee</span>
                                    <span className="text-red-500">-{display(cancelResult.adminFee / 100)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-navy-500">Cancellation Fee</span>
                                <span className="text-red-500">-{display(cancelResult.cancellationFee / 100)}</span>
                            </div>
                            <hr className="border-dashed border-navy-200" />
                            <div className="flex justify-between text-sm font-black">
                                <span className="text-navy-800">Refund Amount</span>
                                <span className="text-emerald-600 text-lg">{display(cancelResult.refundAmount / 100)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fare Policy Info */}
            {fareRules && (
                <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6">
                    <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">info</span>
                        {fareRules.displayName} Cancellation Policy
                    </h4>
                    <div className="space-y-2">
                        {fareRules.cancellation.map((tier, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs font-bold text-navy-600">
                                <span className={`w-2 h-2 rounded-full ${tier.refundPercent > 50 ? 'bg-emerald-400' : tier.refundPercent > 0 ? 'bg-amber-400' : 'bg-red-400'}`} />
                                {tier.label}: <span className="text-navy-900">{tier.refundPercent}% refund</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Voucher Option */}
            {cancelResult?.eligible && (
                <label className="flex items-start gap-4 p-5 bg-white rounded-2xl border-2 border-navy-100 cursor-pointer hover:border-primary/30 transition-colors">
                    <input
                        type="checkbox"
                        checked={voucherOption}
                        onChange={(e) => setVoucherOption(e.target.checked)}
                        className="mt-1"
                    />
                    <div>
                        <h4 className="text-sm font-black text-navy-900 uppercase tracking-wider">Receive as Travel Voucher Instead</h4>
                        <p className="text-xs text-navy-500 font-bold mt-1">
                            Get a <span className="text-primary">10% bonus</span> — receive {display((cancelResult.refundAmount * 1.1) / 100)} as a travel voucher
                            valid for 12 months, usable on any DeltaBlue Jet Air flight.
                        </p>
                    </div>
                </label>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex-1 h-12 border-2 border-navy-100 text-navy-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-50 transition-colors"
                >
                    Keep My Booking
                </button>
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!cancelResult?.eligible}
                    className="flex-1 h-12 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    Cancel Booking
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[80]" onClick={() => !processing && setShowConfirm(false)} />
                    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-5 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500 p-3 bg-red-50 rounded-xl text-2xl">warning</span>
                                <h3 className="text-sm font-black text-navy-900 uppercase tracking-widest">Confirm Cancellation</h3>
                            </div>
                            <p className="text-sm text-navy-600 font-medium">
                                Are you sure you want to cancel booking <span className="font-black">{pnr}</span>?
                                {voucherOption
                                    ? ` A travel voucher of ${display((cancelResult?.refundAmount || 0) * 1.1 / 100)} will be issued.`
                                    : ` A refund of ${display((cancelResult?.refundAmount || 0) / 100)} will be processed.`
                                }
                            </p>
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                    className="flex-1 h-11 border-2 border-navy-100 text-navy-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-navy-50 transition-colors disabled:opacity-50"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="flex-1 h-11 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Cancel'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CancelBooking;
