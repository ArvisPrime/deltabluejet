import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useBookingStore } from '../../stores/bookingStore';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { createPayment, processPayment, confirmPaymentAndBooking } from '../../services/paymentService';
import { useToastStore } from '../../stores/toastStore';

const PaymentProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── Read real booking data from store ─────────────────
  const selectedFlight = useBookingStore((s) => s.selectedFlight);
  const passengers = useBookingStore((s) => s.passengers);
  const bookingId = useBookingStore((s) => s.bookingId);
  const pnr = useBookingStore((s) => s.pnr);
  const { completeBooking } = useBooking();

  // Compute real amounts from booking store
  const pricePerPax = selectedFlight?.price || 0;
  const paxCount = passengers.length || 1;
  const bookingAmountDollars = pricePerPax * paxCount;
  const bookingAmountCents = Math.round(bookingAmountDollars * 100);
  const displayAmount = bookingAmountDollars.toFixed(2);

  // Flight display data
  const originCode = selectedFlight?.origin || '—';
  const destCode = selectedFlight?.destination || '—';
  const flightNumber = selectedFlight?.flightNumber || '—';
  const fareClass = selectedFlight?.fareClass || 'economy';
  const passengerName = passengers[0]
    ? `${passengers[0].firstName} ${passengers[0].lastName}`.toUpperCase()
    : 'PASSENGER';

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    return digits;
  };

  const detectCardBrand = (num: string): string => {
    const d = num.replace(/\D/g, '');
    if (d.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    return 'unknown';
  };

  const isFormValid = () => {
    const digits = cardNumber.replace(/\D/g, '');
    return digits.length >= 15 && expiry.length >= 5 && cvv.length >= 3 && cardholderName.length >= 2;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setProcessing(true);
    setError('');

    try {
      const digits = cardNumber.replace(/\D/g, '');
      const last4 = digits.slice(-4);
      const cardBrand = detectCardBrand(digits);

      // Step 0: Create booking if not already created
      let currentBookingId = bookingId;
      let currentPnr = pnr;
      if (!currentBookingId) {
        const result = await completeBooking();
        currentBookingId = result.bookingId;
        currentPnr = result.pnr;
      }

      // Step 1: Create payment record
      const paymentId = await createPayment({
        bookingId: currentBookingId!,
        amount: bookingAmountCents,
        cardLast4: last4,
        cardBrand,
        metadata: {
          passengerName: passengerName || cardholderName,
          flightNumber,
          route: `${originCode} → ${destCode}`,
          seatClass: fareClass,
        },
      });

      // Step 2: Process payment (simulated in dev mode)
      const result = await processPayment(paymentId);

      if (result.success && result.eTicketNumber) {
        // Step 3: Confirm booking
        await confirmPaymentAndBooking(
          paymentId,
          currentBookingId!,
          result.eTicketNumber,
          user?.uid || 'anonymous',
        );

        // Navigate to confirmation with real data
        navigate(ROUTES.TICKET_CONFIRMATION, {
          state: {
            paymentId,
            eTicketNumber: result.eTicketNumber,
            amount: displayAmount,
            last4,
            cardBrand,
            pnr: currentPnr,
            origin: originCode,
            destination: destCode,
            flightNumber,
            fareClass,
            bookingId: currentBookingId,
          },
        });
      } else {
        setError('Payment declined. Please check your card details and try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      useToastStore.getState().addToast("Payment error", "error");
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
          <button onClick={() => navigate(ROUTES.SEAT_SELECTION)} className="hover:text-primary transition-colors">Seats</button>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Payment</span>
        </nav>
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-black text-navy-950 tracking-tighter flex items-center gap-3">
            SECURE PAYMENT <span className="material-symbols-outlined text-emerald-500">lock</span>
          </h1>
          <span className="text-xs font-black text-navy-400 uppercase tracking-widest">Step 4 of 4</span>
        </div>
        <div className="h-2 w-full bg-navy-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary w-full rounded-full"></div>
        </div>
        <p className="text-navy-500 font-medium">Enter your card details to complete the booking.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3" role="alert">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-6">
            <h3 className="text-xs font-black text-navy-400 uppercase tracking-widest">Payment Method</h3>
            <div className="space-y-4">
              <label className="flex items-center p-5 rounded-2xl border-2 border-primary bg-primary/5 cursor-pointer">
                <input type="radio" checked readOnly className="h-5 w-5 text-primary" name="pm" />
                <div className="ml-4 flex-1 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black text-navy-950">Credit or Debit Card</span>
                    <span className="block text-[10px] text-navy-400 uppercase font-black tracking-widest">Visa, Mastercard, Amex</span>
                  </div>
                  <span className="material-symbols-outlined text-navy-300">credit_card</span>
                </div>
              </label>
            </div>
          </div>

          {/* Card Form */}
          <div className="bg-white rounded-3xl border border-navy-100 p-8 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-navy-400 uppercase tracking-widest">Card Details</h3>
              <div className="flex gap-2">
                {['VISA', 'MC', 'AMEX'].map((brand) => (
                  <div key={brand} className={`h-6 w-10 rounded flex items-center justify-center text-[10px] font-black ${detectCardBrand(cardNumber) === brand.toLowerCase().replace('mc', 'mastercard')
                    ? 'bg-primary/10 text-primary'
                    : 'bg-navy-50 text-navy-400'
                    }`}>
                    {brand}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Card Number</label>
                <div className="relative">
                  <input
                    className="w-full h-14 pl-12 pr-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    disabled={processing}
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-navy-300">credit_card</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Expiry Date</label>
                  <input
                    className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    disabled={processing}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">CVV</label>
                  <input
                    className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="123"
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={processing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Cardholder Name</label>
                <input
                  className="w-full h-14 px-4 bg-navy-50 border-none rounded-xl font-bold text-navy-900 focus:ring-2 focus:ring-primary/20 uppercase outline-none"
                  placeholder="JOHN DOE"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                  disabled={processing}
                />
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <span className="material-symbols-outlined text-emerald-500">verified_user</span>
            <div>
              <p className="text-xs font-black text-emerald-700">Secure Payment</p>
              <p className="text-[10px] text-emerald-600 font-medium">Your card details are fully protected.</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || processing}
            className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {processing ? (
              <>
                <div className="animate-spin size-5 border-2 border-white/30 border-t-white rounded-full" />
                Processing Payment...
              </>
            ) : (
              <>
                Pay Now — ${displayAmount}
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate(ROUTES.SEAT_SELECTION)}
            disabled={processing}
            className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-all border-2 border-navy-100 text-navy-500 hover:bg-navy-50 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Seat Selection
          </button>
        </div>

        {/* Booking Summary Sidebar */}
        <div className="space-y-6 sticky top-8">
          <div className="bg-navy-950 rounded-3xl p-8 text-white space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Booking Summary</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">flight</span>
                </div>
                <div>
                  <p className="text-xl font-black">{originCode} → {destCode}</p>
                  <p className="text-[10px] font-black uppercase opacity-40">Deltablue Jet Air • {flightNumber}</p>
                </div>
              </div>
              <hr className="border-white/10" />
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Fare Type</span>
                  <span className="text-white opacity-100 capitalize">{fareClass} Standard</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Passengers</span>
                  <span className="text-white opacity-100">{paxCount}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Lead Passenger</span>
                  <span className="text-white opacity-100">{passengerName || cardholderName || 'PASSENGER'}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-widest opacity-40">Total to Pay</span>
                <span className="text-3xl font-black">${displayAmount}</span>
              </div>
            </div>
          </div>

          {/* Dev Mode Indicator */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              <span className="material-symbols-outlined text-xs align-middle mr-1">science</span>
              Dev Mode — Payments are simulated
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
