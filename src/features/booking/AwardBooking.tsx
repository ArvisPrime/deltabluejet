import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../config/routes';
import { useToastStore } from '../../stores/toastStore';
import { useAuthStore } from '../../stores/authStore';
import {
    getAwardMilesCost, createAwardBooking, getLoyaltyStatus,
    ROUTE_DISTANCES, AWARD_PRICING,
} from '../../services/loyaltyService';

const AIRPORTS = ['BJL', 'DSS', 'LHR', 'JFK', 'DXB', 'ACC'];
const FARE_CLASSES = ['economy', 'business', 'first'];

const AwardBooking: React.FC = () => {
    const addToast = useToastStore(s => s.addToast);
    const user = useAuthStore(s => s.user);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [fareClass, setFareClass] = useState('economy');
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [milesBalance, setMilesBalance] = useState(0);
    const [loadingBalance, setLoadingBalance] = useState(false);

    const milesCost = useMemo(() => {
        if (!origin || !destination || origin === destination) return 0;
        return getAwardMilesCost(origin, destination, fareClass);
    }, [origin, destination, fareClass]);

    const routeKey = `${origin}-${destination}`;
    const distance = ROUTE_DISTANCES[routeKey] || 0;

    const loadBalance = async () => {
        if (!user?.uid) return;
        setLoadingBalance(true);
        try {
            const loyalty = await getLoyaltyStatus(user.uid);
            setMilesBalance(loyalty.totalPoints);
        } catch { /* ignore */ }
        setLoadingBalance(false);
    };

    const handleContinue = () => {
        if (!origin || !destination) { addToast('Select both origin and destination', 'error'); return; }
        if (origin === destination) { addToast('Origin and destination must differ', 'error'); return; }
        loadBalance();
        setStep(2);
    };

    const handleConfirm = async () => {
        if (!user?.uid) { addToast('Please log in', 'error'); return; }
        setSubmitting(true);
        try {
            const result = await createAwardBooking(user.uid, origin, destination, fareClass);
            if (result.success) {
                setConfirmed(true);
                addToast(result.message, 'success');
            } else {
                addToast(result.message, 'error');
            }
        } catch { addToast('Booking failed', 'error'); }
        setSubmitting(false);
    };

    const selectClass = 'w-full px-4 py-3 rounded-xl bg-navy-50 border-none text-sm font-bold text-navy-800 focus:ring-2 focus:ring-primary/20';
    const labelClass = 'text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2';

    if (confirmed) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 font-display">
                <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">flight_takeoff</span>
                </div>
                <h2 className="text-2xl font-black text-navy-950 tracking-tighter mb-2">Award Booking Confirmed!</h2>
                <p className="text-sm text-navy-500 mb-1">{origin} → {destination} • {fareClass}</p>
                <p className="text-sm text-navy-500 mb-8">{milesCost.toLocaleString()} miles deducted from your account</p>
                <Link to={ROUTES.MY_TRIPS || '/my/trips'}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 shadow-lg shadow-primary/20">
                    View My Trips
                </Link>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto font-display custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-navy-300">
                    <Link to={ROUTES.HOME} className="hover:text-primary transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to={ROUTES.LOYALTY || '/loyalty'} className="hover:text-primary transition-colors">Loyalty</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary">Award Booking</span>
                </nav>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-navy-950 tracking-tighter uppercase">Book with Miles</h1>
                    <p className="text-navy-400 font-bold text-[10px] uppercase tracking-widest">
                        Use your DeltaBlue Club miles for free flights
                    </p>
                </div>
            </div>

            {/* Award Chart */}
            <div className="bg-navy-50/30 rounded-2xl border border-navy-100 p-5 mb-8 max-w-2xl">
                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest mb-3">Award Chart (one-way, miles)</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-navy-100">
                                <th className="text-[10px] font-black text-navy-400 uppercase tracking-widest py-2 pr-4">Route Type</th>
                                {FARE_CLASSES.map(fc => (
                                    <th key={fc} className="text-[10px] font-black text-navy-400 uppercase tracking-widest py-2 px-3 text-center">{fc}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(AWARD_PRICING).map(([cat, prices]) => (
                                <tr key={cat} className="border-b border-navy-50">
                                    <td className="text-xs font-bold text-navy-600 py-2 pr-4 capitalize">
                                        {cat} haul {cat === 'short' ? '(≤1500mi)' : cat === 'medium' ? '(1500–4000mi)' : '(4000mi+)'}
                                    </td>
                                    {FARE_CLASSES.map(fc => (
                                        <td key={fc} className="text-xs font-black text-navy-800 py-2 px-3 text-center">
                                            {(prices[fc] || 0).toLocaleString()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Step 1: Route Selection */}
            {step === 1 && (
                <div className="space-y-6 max-w-lg">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Select Route</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>From</label>
                                <select value={origin} onChange={e => setOrigin(e.target.value)} className={selectClass}>
                                    <option value="">Select</option>
                                    {AIRPORTS.filter(a => a !== destination).map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>To</label>
                                <select value={destination} onChange={e => setDestination(e.target.value)} className={selectClass}>
                                    <option value="">Select</option>
                                    {AIRPORTS.filter(a => a !== origin).map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Cabin Class</label>
                            <div className="flex gap-2">
                                {FARE_CLASSES.map(fc => (
                                    <button key={fc} onClick={() => setFareClass(fc)}
                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            fareClass === fc ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
                                        }`}>{fc}</button>
                                ))}
                            </div>
                        </div>
                        {milesCost > 0 && (
                            <div className="bg-primary/5 rounded-xl p-4 text-center">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Miles Required</p>
                                <p className="text-3xl font-black text-navy-950 tracking-tighter">{milesCost.toLocaleString()}</p>
                                {distance > 0 && <p className="text-[10px] text-navy-400 mt-1">{distance.toLocaleString()} mi distance</p>}
                            </div>
                        )}
                    </div>
                    <button onClick={handleContinue} disabled={!origin || !destination || origin === destination}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                        Check Availability →
                    </button>
                </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
                <div className="space-y-6 max-w-lg">
                    <div className="bg-white rounded-2xl border border-navy-100 p-6 space-y-4">
                        <h3 className="font-black text-navy-900 uppercase text-xs tracking-widest">Booking Summary</h3>
                        <div className="flex items-center justify-between p-4 bg-navy-50/30 rounded-xl">
                            <div className="text-center">
                                <p className="text-2xl font-black text-navy-950">{origin}</p>
                                <p className="text-[10px] text-navy-400">Origin</p>
                            </div>
                            <span className="material-symbols-outlined text-primary text-2xl">flight</span>
                            <div className="text-center">
                                <p className="text-2xl font-black text-navy-950">{destination}</p>
                                <p className="text-[10px] text-navy-400">Destination</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Class</p>
                                <p className="text-sm font-black text-navy-900 capitalize">{fareClass}</p>
                            </div>
                            <div className="p-3 bg-navy-50/30 rounded-xl text-center">
                                <p className="text-[10px] font-black text-navy-400 uppercase tracking-widest">Miles Cost</p>
                                <p className="text-sm font-black text-navy-900">{milesCost.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border ${milesBalance >= milesCost ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-navy-600">Your Miles Balance</span>
                                <span className="text-lg font-black text-navy-950">
                                    {loadingBalance ? '...' : milesBalance.toLocaleString()}
                                </span>
                            </div>
                            {milesBalance < milesCost && !loadingBalance && (
                                <p className="text-xs text-red-600 mt-1">
                                    You need {(milesCost - milesBalance).toLocaleString()} more miles
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)}
                            className="flex-1 py-4 border-2 border-navy-100 rounded-2xl font-black text-xs uppercase tracking-widest text-navy-500 hover:bg-navy-50">
                            ← Back
                        </button>
                        <button onClick={handleConfirm} disabled={submitting || milesBalance < milesCost}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                            {submitting ? 'Booking...' : 'Confirm Award Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AwardBooking;
