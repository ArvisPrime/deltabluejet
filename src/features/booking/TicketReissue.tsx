
import React, { useState, useCallback, useMemo } from 'react';
import { getBookingByPNR, getBookingWithPassengers, modifyBooking } from '../../services/booking';
import { getFlightById } from '../../services/firestore';
import { useCurrency } from '../../hooks/useCurrency';
import type { BookingDoc, PassengerDoc, FlightDoc } from '../../types/firestore';

/* ── Fare-class display map ─────────────────────────────────── */
const FARE_CLASS_LABELS: Record<string, string> = {
  Y: 'Economy', W: 'Premium Economy', J: 'Business', F: 'First',
  economy: 'Economy', premium_economy: 'Premium Economy',
  business: 'Business', first: 'First',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  checked_in: { label: 'Checked In', color: 'text-blue-600', bg: 'bg-blue-50' },
  boarded: { label: 'Boarded', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  completed: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' },
  refunded: { label: 'Refunded', color: 'text-red-600', bg: 'bg-red-50' },
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
}



/* ═══════════════════════════════════════════════════════════════
   Ticket Reissue / Change Component
   ═══════════════════════════════════════════════════════════════ */
const TicketReissue: React.FC = () => {
  const { display } = useCurrency();
  /* ── Search state ──────────────────────────────────────────── */
  const [pnr, setPnr] = useState('');
  const [ticketNum, setTicketNum] = useState('');

  /* ── Booking data ──────────────────────────────────────────── */
  const [booking, setBooking] = useState<BookingDoc | null>(null);
  const [passengers, setPassengers] = useState<PassengerDoc[]>([]);
  const [flight, setFlight] = useState<FlightDoc | null>(null);

  /* ── UI state ──────────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Price editing ─────────────────────────────────────────── */
  const [newBaseFare, setNewBaseFare] = useState('');
  const [penaltyFee, setPenaltyFee] = useState('0.00');
  const [paymentMethod, setPaymentMethod] = useState('card');

  /* ── Computed values ───────────────────────────────────────── */
  const originalTotal = booking?.totalAmount ?? 0;
  const currency = booking?.currency ?? 'USD';

  const totalDifference = useMemo(() => {
    const newFare = parseFloat(newBaseFare) || 0;
    const penalty = parseFloat(penaltyFee) || 0;
    return Math.max(0, (newFare + penalty) - originalTotal);
  }, [newBaseFare, penaltyFee, originalTotal]);

  /* ── Retrieve Booking ──────────────────────────────────────── */
  const handleRetrieveBooking = useCallback(async () => {
    const searchVal = pnr.trim();
    if (!searchVal) {
      setError('Please enter a Booking Reference to search.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setBooking(null);
    setPassengers([]);
    setFlight(null);

    try {
      const found = await getBookingByPNR(searchVal);
      if (!found) {
        setError(`No booking found for reference "${searchVal}". Please check and try again.`);
        setLoading(false);
        return;
      }

      setBooking(found);

      // Fetch passengers
      const details = await getBookingWithPassengers(found.id);
      if (details) {
        setPassengers(details.passengers);
      }

      // Fetch flight details
      if (found.flightId) {
        const fl = await getFlightById(found.flightId);
        if (fl) setFlight(fl);
      }

      // Pre-fill fare fields
      setNewBaseFare(found.totalAmount.toFixed(2));
      setPenaltyFee('0.00');
    } catch (err: any) {
      console.error('[TicketReissue] Retrieve error:', err);
      setError('Failed to retrieve booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pnr]);

  /* ── Calculate Price ───────────────────────────────────────── */
  const handleAutoPrice = useCallback(() => {
    if (!booking) return;
    // Simple auto-calculation: keep current fare + penalty
    const currentFare = booking.totalAmount;
    setNewBaseFare(currentFare.toFixed(2));
    setPenaltyFee('0.00');
  }, [booking]);

  /* ── Save Draft ────────────────────────────────────────────── */
  const handleSaveDraft = useCallback(() => {
    if (!booking) return;
    const draft = {
      bookingId: booking.id,
      pnr: booking.pnr,
      newBaseFare,
      penaltyFee,
      paymentMethod,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(`reissue_draft_${booking.pnr}`, JSON.stringify(draft));
    setSuccessMsg('Draft saved successfully. You can return to complete this later.');
    setTimeout(() => setSuccessMsg(null), 4000);
  }, [booking, newBaseFare, penaltyFee, paymentMethod]);

  /* ── Issue New Ticket ──────────────────────────────────────── */
  const handleIssueTicket = useCallback(async () => {
    if (!booking) return;

    const newAmount = parseFloat(newBaseFare) || 0;
    if (newAmount <= 0) {
      setError('Please enter a valid fare amount.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await modifyBooking({
        bookingId: booking.id,
        newTotalAmount: newAmount + (parseFloat(penaltyFee) || 0),
      });

      // Clear draft if exists
      sessionStorage.removeItem(`reissue_draft_${booking.pnr}`);

      setSuccessMsg(`New ticket issued successfully for booking ${booking.pnr}. The updated fare is ${display(newAmount + (parseFloat(penaltyFee) || 0))}.`);

      // Refresh booking data
      const refreshed = await getBookingByPNR(booking.pnr);
      if (refreshed) setBooking(refreshed);
    } catch (err: any) {
      console.error('[TicketReissue] Issue error:', err);
      setError('Failed to issue new ticket. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  }, [booking, newBaseFare, penaltyFee, currency]);

  /* ── Render helpers ────────────────────────────────────────── */
  const fareLabel = (cls: string) => FARE_CLASS_LABELS[cls] ?? cls;
  const statusInfo = (s: string) => STATUS_LABELS[s] ?? { label: s, color: 'text-navy-600', bg: 'bg-navy-50' };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-400 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">confirmation_number</span>
            Ticket Management
          </div>
          <h1 className="text-4xl font-black text-navy-950 tracking-tighter">Ticket Reissue</h1>
          <p className="text-navy-500 font-medium">Handle fare changes, route updates, and issue updated tickets.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-6 py-2.5 bg-white border border-navy-100 text-navy-700 font-bold rounded-xl shadow-sm hover:bg-navy-50 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">history</span> View History
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
            <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span> Recent Changes
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-navy-400 hover:text-navy-600 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="p-8">
            {booking ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-2 bg-emerald-500 rounded-full" />
                  <span className="text-navy-500">Booking created:</span>
                  <span className="font-bold text-navy-900">{formatDate(booking.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-2 bg-blue-500 rounded-full" />
                  <span className="text-navy-500">Last updated:</span>
                  <span className="font-bold text-navy-900">{formatDate(booking.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-2 bg-navy-300 rounded-full" />
                  <span className="text-navy-500">Current status:</span>
                  <span className="font-bold text-navy-900">{statusInfo(booking.status).label}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-navy-400 italic">Retrieve a booking first to view its history.</p>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Search Card */}
      <div className="bg-white p-8 rounded-3xl border-2 border-navy-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-black text-navy-400 uppercase">Booking Reference</label>
            <input
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              placeholder="e.g. DJ8273X"
              className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-black text-lg focus:ring-2 focus:ring-primary/20 text-navy-900"
              onKeyDown={(e) => e.key === 'Enter' && handleRetrieveBooking()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-navy-400 uppercase">Ticket Number (Optional)</label>
            <input
              value={ticketNum}
              onChange={(e) => setTicketNum(e.target.value)}
              placeholder="012-0000000000"
              className="w-full h-12 px-5 bg-navy-50 rounded-xl border-none font-bold text-lg focus:ring-2 focus:ring-primary/20 text-navy-900"
            />
          </div>
          <button
            onClick={handleRetrieveBooking}
            disabled={loading}
            className="h-12 bg-primary text-white font-black rounded-xl hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">search</span> Find Booking
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content — only shown after booking is retrieved */}
      {booking && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Left Column — Flight Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Passenger Summary */}
            {passengers.length > 0 && (
              <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
                <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100">
                  <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Passengers ({passengers.length})
                  </h3>
                </div>
                <div className="p-4">
                  <div className="divide-y divide-navy-50">
                    {passengers.map((pax, idx) => (
                      <div key={pax.id} className="flex items-center gap-4 px-4 py-3">
                        <span className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-bold text-navy-900">{pax.firstName} {pax.lastName}</p>
                          <p className="text-xs text-navy-400">{pax.documentType === 'passport' ? 'Passport' : 'National ID'}: {pax.documentNumber}</p>
                        </div>
                        {pax.seatNumber && (
                          <span className="px-2 py-0.5 bg-navy-50 text-navy-600 rounded-md font-bold text-xs">
                            Seat {pax.seatNumber}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Flight Details */}
            <div className="bg-white rounded-3xl border border-navy-100 shadow-sm overflow-hidden">
              <div className="px-8 py-4 bg-navy-50/50 border-b border-navy-100 flex items-center justify-between">
                <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">connecting_airports</span> Flight Details
                </h3>
              </div>
              <div className="p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[10px] font-black text-navy-400 uppercase tracking-widest">
                      <th className="px-4 py-3">Flight</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    <tr className="group">
                      <td className="px-4 py-5 font-bold text-navy-900">{booking.flightNumber}</td>
                      <td className="px-4 py-5 text-sm font-medium text-navy-500">{formatDate(booking.departureTime)}</td>
                      <td className="px-4 py-5 font-bold font-mono">
                        {booking.origin?.code ?? '—'} <span className="text-navy-300">→</span> {booking.destination?.code ?? '—'}
                      </td>
                      <td className="px-4 py-5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-xs">
                          {fareLabel(booking.fareClass)}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`flex items-center gap-1.5 ${statusInfo(booking.status).color} font-bold text-xs ${statusInfo(booking.status).bg} px-2 py-1 rounded-full w-fit`}>
                          <span className="size-1.5 bg-current rounded-full" />
                          {statusInfo(booking.status).label}
                        </span>
                      </td>
                    </tr>
                    {/* Show multi-city segments if present */}
                    {booking.segments?.map((seg, idx) => (
                      <tr key={idx} className="group">
                        <td className="px-4 py-5 font-bold text-navy-900">{seg.flightNumber}</td>
                        <td className="px-4 py-5 text-sm font-medium text-navy-500">{formatDate(seg.departureTime)}</td>
                        <td className="px-4 py-5 font-bold font-mono">
                          {seg.origin?.code ?? '—'} <span className="text-navy-300">→</span> {seg.destination?.code ?? '—'}
                        </td>
                        <td className="px-4 py-5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-xs">
                            {fareLabel(seg.fareClass)}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full w-fit">
                            <span className="size-1.5 bg-emerald-500 rounded-full" />
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flight Extra Info */}
            {flight && (
              <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6">
                <h3 className="font-black text-navy-900 uppercase text-xs tracking-wider flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">info</span> Flight Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase">Aircraft</p>
                    <p className="font-bold text-navy-900">{flight.aircraft?.type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase">From</p>
                    <p className="font-bold text-navy-900">{booking.origin?.city || booking.origin?.code || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase">To</p>
                    <p className="font-bold text-navy-900">{booking.destination?.city || booking.destination?.code || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-navy-400 uppercase">Passengers</p>
                    <p className="font-bold text-navy-900">{booking.passengerCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column — Pricing & Payment */}
          <div className="space-y-6">
            {/* Fare Summary */}
            <div className="bg-white p-8 rounded-3xl border border-navy-100 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-navy-900 tracking-tight">Fare Summary</h3>

              {/* Original Fare */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Original Fare</p>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-navy-500">Total Paid</span>
                  <span className="text-navy-900">{display(originalTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-navy-500">Travel Class</span>
                  <span className="text-navy-900">{fareLabel(booking.fareClass)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-navy-500">Passengers</span>
                  <span className="text-navy-900">{booking.passengerCount}</span>
                </div>
              </div>

              {/* Updated Price */}
              <div className="bg-primary/5 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Updated Price</p>
                  <button
                    onClick={handleAutoPrice}
                    className="text-[10px] font-black text-primary underline hover:text-primary-600 transition-colors"
                  >
                    Calculate Price
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-navy-400 uppercase">New Fare Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newBaseFare}
                      onChange={(e) => setNewBaseFare(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-navy-100 rounded-lg text-sm font-bold text-navy-900 text-right"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-navy-400 uppercase">Change Fee</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={penaltyFee}
                      onChange={(e) => setPenaltyFee(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-red-100 text-red-600 rounded-lg text-sm font-bold text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Total Difference */}
              <div className="pt-4 border-t border-navy-100 space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-navy-400">Amount Due</span>
                  <span className="text-2xl font-black text-navy-950">
                    {display(totalDifference)}
                  </span>
                </div>
                {totalDifference === 0 && (
                  <p className="text-[10px] text-right text-emerald-500 font-bold">No additional payment required</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-navy-400 uppercase tracking-widest">Payment Method</h4>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-4 bg-navy-50 border-none rounded-xl text-sm font-bold text-navy-700 focus:ring-2 focus:ring-primary/20"
              >
                <option value="card">Credit / Debit Card</option>
                <option value="credit_line">Agency Credit Line</option>
                <option value="cash">Cash Payment</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!booking && !loading && !error && (
        <div className="bg-white rounded-3xl border border-navy-100 shadow-sm p-16 text-center">
          <span className="material-symbols-outlined text-6xl text-navy-200 mb-4 block">confirmation_number</span>
          <h3 className="text-lg font-black text-navy-900 mb-2">No Booking Selected</h3>
          <p className="text-sm text-navy-400 max-w-md mx-auto">
            Enter a Booking Reference above and click <strong>Find Booking</strong> to retrieve the ticket details and begin the reissue process.
          </p>
        </div>
      )}

      {/* Bottom Action Bar */}
      {booking && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-navy-100 p-6 flex justify-center z-40">
          <div className="max-w-6xl w-full flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl text-xs font-bold border border-amber-100">
              <span className="material-symbols-outlined text-lg">warning</span>
              This action cannot be undone once the new ticket is issued.
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSaveDraft}
                className="px-8 py-3 bg-white border border-navy-200 text-navy-700 font-black rounded-xl hover:bg-navy-50 transition-all"
              >
                Save Draft
              </button>
              <button
                onClick={handleIssueTicket}
                disabled={isSubmitting}
                className="px-10 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">print</span> Issue Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketReissue;
